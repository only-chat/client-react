import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import ConversationInfo, { type ConversationData } from './conversation'
import MessageHandlersContext, { type Action } from './messageHandlersContext'
import TextMessageEditor from './textMessageEditor'
import UserContext from './userContext'
import { createMessage } from './responses'

import type {
    ConversationClosedResponse,
    ConversationDeletedResponse,
    ConversationUpdatedResponse,
    FileMessageResponse,
    JoinedResponse,
    LeftResponse,
    LoadedMessagesResponse,
    Message,
    MessageDeletedResponse,
    MessageUpdatedResponse,
    TextMessageResponse,
} from './responses'

export interface FileMessage {
    link: string
    name: string
    type: string
    size: number
}

export interface TextMessage {
    text: string
}

export type MessageType = 'text' | 'file'

export type MessageMetadata = { reply?: string[], forward?: string[] }

type Response = ConversationClosedResponse | ConversationDeletedResponse | ConversationUpdatedResponse | FileMessageResponse | JoinedResponse | LeftResponse | LoadedMessagesResponse | MessageDeletedResponse | MessageUpdatedResponse | TextMessageResponse

interface MessagesProps {
    conversation: ConversationData
    update: (id: string, participants?: string[], title?: string) => void
    close: (id: string) => void
    delete: (id: string) => void
    messageUpdate: (id: string, data: FileMessage | TextMessage) => void
    messageDelete: (id: string) => void
    send: (type: MessageType, data: FileMessage | TextMessage, metadata?: MessageMetadata) => void
    loadMore: (before?: Date, excludeIds?: string[]) => void
}

export const Messages = (props: MessagesProps) => {
    const user = useContext(UserContext)
    const handlers = useContext(MessageHandlersContext)
    const [conversation, setConversation] = useState(props.conversation)
    const [update, setUpdate] = useState(new Set())
    const [reply, setReply] = useState(new Set<string>())
    const [forward, setForward] = useState(new Set<string>())
    const [updating, setUpdating] = useState(new Set())

    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const updateConversation = (c: ConversationData) => {
            setUpdating(new Set())
            setUpdate(new Set())
            setConversation(c)
        }

        const addMessage = (msg: Message) => {
            const updated = { ...conversation }

            if (updated.total && updated.messages?.length) {
                for (let i = updated.messages.length - 1; i >= 0 && updated.messages[i].createdAt >= msg.createdAt; --i) {
                    if (updated.messages[i].id === msg.id) {
                        return
                    }
                }

                updated.messages.push(msg)
                ++updated.total
            } else {
                updated.messages = [msg]
                updated.total = 1
            }

            updateConversation(updated)
        }

        const appendMessages = (messages: Message[], count: number) => {
            if (!count || !messages?.length) {
                return
            }

            const conversationMessages = messages?.filter(m => m.conversationId === conversation.id)
            if (!conversationMessages?.length) {
                return
            }

            const updated = { ...conversation }

            if (conversation.total && conversation.messages?.length) {
                updated.messages = conversationMessages.concat(conversation.messages)
                updated.total = updated.messages?.length ?? 0
            } else {
                updated.messages = conversationMessages
                updated.total = count
            }

            updateConversation(updated)
        }

        const deleteMessage = (response: MessageDeletedResponse) => {
            const { messageId, deletedAt } = response.data
            const deletedMessage = conversation.messages?.find(m => m.id === messageId)
            if (deletedMessage) {
                deletedMessage.deletedAt = new Date(deletedAt)
                const messages = conversation.messages ? [...conversation.messages] : undefined
                updateConversation({ ...conversation, messages })
            }
        }

        const updateMessage = (response: MessageUpdatedResponse) => {
            const { messageId, updatedAt } = response.data
            const updatedMessage = conversation.messages?.find(m => m.id === messageId)
            if (updatedMessage) {
                switch (updatedMessage.type) {
                    case 'file':
                        {
                            const { link, name, type, size } = response.data
                            updatedMessage.data = { link, name, type, size }
                        }
                        break
                    case 'text':
                        {
                            const { text } = response.data
                            updatedMessage.data = { text }
                        }
                        break
                }
                updatedMessage.updatedAt = new Date(updatedAt)
                const messages = conversation.messages ? [...conversation.messages] : undefined
                updateConversation({ ...conversation, messages })
            }
        }

        const handleMessage = (response: Response) => {
            if (response.type === 'loaded-messages') {
                appendMessages(response.messages?.map(createMessage), response.count)
                return
            }

            if (conversation.id === response.conversationId) {
                switch (response.type) {
                    case 'joined':
                        {
                            const connected = conversation.connected ?? [response.fromId]
                            if (!connected.includes(response.fromId)) {
                                connected.push(response.fromId)
                            }

                            updateConversation({ ...conversation, connected })
                        }
                        break
                    case 'left':
                        {
                            let connected = conversation.connected
                            if (connected?.includes(response.fromId)) {
                                connected = connected.filter(id => id !== response.fromId)
                            }

                            updateConversation({ ...conversation, connected })
                        }
                        break
                    case 'message-deleted':
                        deleteMessage(response)
                        break
                    case 'message-updated':
                        updateMessage(response)
                        break
                    case 'file':
                    case 'text':
                        addMessage(createMessage(response))
                        break
                }
            }

            if (conversation.id === (response.data as ConversationClosedResponse | ConversationDeletedResponse | ConversationUpdatedResponse)?.conversationId) {
                switch (response.type) {
                    case 'closed':
                        updateConversation({ ...conversation, closedAt: new Date(response.data.closedAt) })
                        break
                    case 'deleted':
                        updateConversation({ ...conversation, closedAt: new Date(response.data.closedAt), deletedAt: new Date(response.data.deletedAt) })
                        break
                    case 'updated':
                        updateConversation({ ...conversation, title: response.data.title, participants: response.data.participants, updatedAt: new Date(response.data.updatedAt) })
                        break
                }
            }
        }

        handlers.add(handleMessage as Action)

        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

        return () => {
            handlers.remove(handleMessage as Action)
        }
    }, [handlers, conversation])

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleClickLoad = (e: React.MouseEvent) => {
        const excludeIds: string[] = []
        let before: Date | undefined

        if (conversation?.messages) {
            const count = conversation.messages?.length ?? 0
            for (let i = 0; i < count; ++i) {
                if (before) {
                    if (conversation.messages[i].createdAt >= before) {
                        excludeIds.push(conversation.messages[i].id!)
                    } else {
                        break
                    }
                } else {
                    before = conversation.messages[i].createdAt
                    excludeIds.push(conversation.messages[i].id!)
                }
            }
        }

        props.loadMore(before, excludeIds)
    }

    const handleChangeReply = (e: React.ChangeEvent) => {
        const set = new Set(reply)
        const id = (e.currentTarget as HTMLElement).dataset.id!
        if (set.has(id)) {
            set.delete(id)
        } else {
            set.add(id)
        }

        setReply(set)
    }

    const handleChangeForward = (e: React.ChangeEvent) => {
        const set = new Set(forward)
        const id = (e.currentTarget as HTMLElement).dataset.id!
        if (set.has(id)) {
            set.delete(id)
        } else {
            set.add(id)
        }

        setForward(set)
    }

    const handleChangeUpdate = (e: React.ChangeEvent) => {
        const set = new Set(update)
        const id = (e.currentTarget as HTMLElement).dataset.id
        if (set.has(id)) {
            set.delete(id)
        } else {
            set.add(id)
        }

        setUpdate(set)
    }

    const handleClickMessageDelete = (e: React.MouseEvent) => {
        const set = new Set(updating)
        const id = (e.currentTarget as HTMLElement).dataset.id!
        set.add(id)
        setUpdating(set)

        props.messageDelete(id)
    }

    const propsMessageUpdate = props.messageUpdate

    const messageUpdate = useCallback((id: string | undefined, _: MessageType, data: FileMessage | TextMessage) => {
        const set = new Set(updating)
        set.add(id)
        setUpdating(set)

        propsMessageUpdate(id!, data)
    }, [updating, propsMessageUpdate])

    const propsSend = props.send

    const messageSend = useCallback((_: string | undefined, type: MessageType, data: FileMessage | TextMessage) => {
        let metadata: MessageMetadata | undefined = undefined;

        if (reply.size > 0) {
            metadata = { reply: [...reply] }
        }

        if (forward.size > 0) {
            metadata ??= {};
            metadata.forward = [...forward]
        }

        setReply(new Set<string>())
        setForward(new Set<string>())

        propsSend(type, data, metadata)
    }, [reply, forward, propsSend])

    const { closedAt, messages, total } = conversation

    return <>
        <h1>Conversation</h1>
        <ConversationInfo conversation={conversation} onClose={props.close} onDelete={props.delete} onUpdate={props.update} />
        <h1>Messages</h1>
        <button onClick={handleClickLoad} disabled={messages?.length === total}>Load more</button>
        <span> Loaded: {messages?.length}</span>
        <span> Total: {total}</span>
        <div style={{ border: '1px solid #ccc', padding: 10, height: 300, overflowY: 'scroll' }}>
            {messages?.map(m => <div key={m.id} style={{ display: 'flex', alignItems: 'flex-end', margin: 20 }}>
                <div>
                    <div>Id: {m.id}</div>
                    <div>From: {m.fromId}</div>
                    <div>Type: {m.type}</div>
                    <div>Data: {JSON.stringify(m.data)}</div>
                    <div>Metadata: {JSON.stringify(m.metadata)}</div>
                    <div>CreatedAt: {m.createdAt.toLocaleString()}</div>
                    {!!m.updatedAt && <div style={{ color: 'green' }}>UpdatedAt: {m.updatedAt.toLocaleString()}</div>}
                    {!!m.deletedAt && <div style={{ color: 'red' }}>DeletedAt: {m.deletedAt.toLocaleString()}</div>}
                    <div>Participants: {m.participants.join(', ')}</div>
                    {!m.deletedAt && <div>
                        <input type='checkbox' id={'reply-' + m.id} data-id={m.id} checked={reply.has(m.id!)} onChange={handleChangeReply} />
                        <label htmlFor={'reply-' + m.id}>Reply To</label>
                        <input type='checkbox' id={'forward-' + m.id} data-id={m.id} checked={forward.has(m.id!)} onChange={handleChangeForward} />
                        <label htmlFor={'forward-' + m.id}>Forward</label>
                    </div>}
                    {!m.deletedAt && m.fromId === user.name && <>
                        <button data-id={m.id} disabled={updating.has(m.id)} onClick={handleClickMessageDelete}>Delete</button>
                        <input type='checkbox' id={'update-' + m.id} data-id={m.id} checked={update.has(m.id)} disabled={updating.has(m.id)} onChange={handleChangeUpdate} />
                        <label htmlFor={'update-' + m.id}>Update</label>
                    </>}
                </div>
                {m.id && !m.deletedAt && update.has(m.id) && <TextMessageEditor id={m.id} type={m.type as MessageType} data={m.data as FileMessage | TextMessage} ok={messageUpdate} />}
            </div>)}
            <div ref={messagesEndRef} />
        </div>
        {!closedAt && <TextMessageEditor ok={messageSend} />}
    </>
}

export default Messages