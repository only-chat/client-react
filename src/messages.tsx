import React, { useCallback, useContext, useEffect, useState } from 'react'
import ConversationInfo, { type ConversationData } from './conversation'
import MessageHandlersContext from './messageHandlersContext'
import TextMessageEditor from './textMessageEditor'
import UserContext from './userContext'

export interface ConversationUpdate {
    title?: string
    participants?: string[]
}

export interface FileMessage {
    link: string
    name: string
    type: string
    size: number
}

export interface TextMessage {
    text: string
}

export interface MessageDelete {
    messageId: string
}

export interface MessageUpdate extends Partial<FileMessage>, Partial<TextMessage> {
    messageId: string
}

export type MessageType = 'text' | 'file'

interface FindRequest {
    from?: number
    size?: number
    sort?: string
    sortDesc?: boolean
    ids?: string[]
    clientMessageIds?: string[]
    excludeIds?: string[]
    conversationIds?: string[]
    fromIds?: string[]
    types?: MessageType[]
    createdFrom?: Date
    createdTo?: Date
    text?: string
}
export interface LoadRequest {
    from?: number
    size?: number
    excludeIds?: string[]
    before?: Date
}

export type MessageData = ConversationUpdate | FileMessage | FindRequest | LoadRequest | MessageDelete | MessageUpdate | TextMessage | null
export interface Message {
    id?: string
    clientMessageId?: string
    conversationId: string
    participants: string[]
    connectionId: string
    fromId: string
    type: MessageType
    data: MessageData
    createdAt: Date
    updatedAt?: Date
    deletedAt?: Date
}

export const createMessage = (response: any) => ({
    id: response.id,
    conversationId: response.conversationId,
    participants: response.participants,
    connectionId: response.connectionId,
    fromId: response.fromId,
    type: response.type,
    data: response.data,
    createdAt: new Date(response.createdAt),
    updatedAt: response.updatedAt ? new Date(response.updatedAt) : undefined,
    deletedAt: response.deletedAt ? new Date(response.deletedAt) : undefined,
} as Message)

interface MessagesProps {
    conversation: ConversationData
    update: (id: string, participants?: string[], title?: string) => void
    close: (id: string) => void
    delete: (id: string) => void
    messageUpdate: (id: string, data: FileMessage | TextMessage) => void
    messageDelete: (id: string) => void
    send: (type: MessageType, data: FileMessage | TextMessage) => void
    loadMore: (before?: Date, excludeIds?: string[]) => void
}

export const Messages = (props: MessagesProps) => {
    const user = useContext(UserContext)
    const handlers = useContext(MessageHandlersContext)
    const [conversation, setConversation] = useState(props.conversation)
    const [update, setUpdate] = useState(new Set())
    const [updating, setUpdating] = useState(new Set())

    const messagesEndRef = React.createRef<HTMLDivElement>()

    useEffect(() => {
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

            setConversation(updated)
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
            } else {
                updated.messages = conversationMessages
                updated.total = count
            }

            setConversation(updated)
        }

        const deleteMessage = (response: any) => {
            const { messageId, deletedAt } = response.data
            const deletedMessage = conversation.messages?.find(m => m.id === messageId)
            if (deletedMessage) {
                deletedMessage.deletedAt = new Date(deletedAt)
                const messages = conversation.messages ? [...conversation.messages] : undefined
                setConversation({ ...conversation, messages })
            }
        }

        const updateMessage = (response: any) => {
            const { messageId, updatedAt } = response.data
            const updatedMessage = conversation.messages?.find(m => m.id === messageId)
            if (updatedMessage) {
                switch (updatedMessage.type) {
                    case 'file':
                        {
                            const { link, name, type, size } = response.data as FileMessage
                            updatedMessage.data = { link, name, type, size }
                        }
                        break
                    case 'text':
                        {
                            const { text } = response.data as TextMessage
                            updatedMessage.data = { text }
                        }
                        break
                }
                updatedMessage.updatedAt = new Date(updatedAt)
                const messages = conversation.messages ? [...conversation.messages] : undefined
                setConversation({ ...conversation, messages })
            }
        }

        const handleMessage = (response: any) => {
            if (response.type === 'loaded-messages') {
                const loaded = response.messages?.map(createMessage)
                const count = response.count

                const updated = { ...conversation }

                if (loaded?.length && count) {
                    if (updated.total && updated.messages?.length) {
                        updated.total = updated.messages.length + count
                        updated.messages = loaded.concat(updated.messages)
                    } else {
                        updated.messages = loaded
                        updated.total = count
                    }
                } else {
                    updated.total = updated.messages?.length ?? 0
                }

                setConversation(updated)
                return
            }

            if (conversation.id !== response.conversationId) {
                return
            }

            switch (response.type) {
                case 'closed':
                    setConversation({ ...conversation, closedAt: new Date(response.data.closedAt) })
                    break
                case 'deleted':
                    setConversation({ ...conversation, closedAt: new Date(response.data.closedAt), deletedAt: new Date(response.data.deletedAt) })
                    break
                case 'joined':
                    {
                        const connected = conversation.connected ?? [response.fromId]
                        if (!connected.includes(response.fromId)) {
                            connected.push(response.fromId)
                        }

                        setConversation({ ...conversation, connected })
                    }
                    break
                case 'left':
                    {
                        let connected = conversation.connected
                        if (connected?.includes(response.fromId)) {
                            connected = connected.filter(id => id !== response.fromId)
                        }

                        setConversation({ ...conversation, connected })
                    }
                    break
                case 'loaded-messages':
                    appendMessages(response.messages?.map(createMessage), response.count)
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
                case 'updated':
                    setConversation({ ...conversation, title: response.data.title, participants: response.data.participants, updatedAt: new Date(response.data.updatedAt) })
                    break
            }
        }

        handlers.add(handleMessage)

        return () => {
            handlers.remove(handleMessage)
        }
    }, [handlers, conversation, setConversation])

    useEffect(() => {
        setUpdating(new Set())
        setUpdate(new Set())
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversation, setUpdating, setUpdate])

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

    const handleChangeUpdate = (e: React.ChangeEvent) => {
        const set = new Set(update)
        const id = e.currentTarget.getAttribute('data-id')
        if (set.has(id)) {
            set.delete(id)
        } else {
            set.add(id)
        }

        setUpdate(set)
    }

    const handleClickMessageDelete = (e: React.MouseEvent) => {
        const set = new Set(updating)
        const id = e.currentTarget.getAttribute('data-id')!
        set.add(id)
        setUpdating(set)

        props.messageDelete(id)
    }

    const handleClickUpdate = useCallback((id: string, participants?: string[], title?: string) => {
        props.update(id, participants, title)
    }, [props.update])

    const handleClickClose = useCallback((id: string) => {
        props.close(id)
    }, [props.close])

    const handleClickDelete = useCallback((id: string) => {
        props.delete(id)
    }, [props.delete])

    const messageUpdate = useCallback((id: string | undefined, _: MessageType, data: FileMessage | TextMessage) => {
        const set = new Set(updating)
        set.add(id)
        setUpdating(set)

        props.messageUpdate(id!, data)
    }, [props.messageUpdate])

    const messageSend = useCallback((_: string | undefined, type: MessageType, data: FileMessage | TextMessage) => {
        props.send(type, data)
    }, [props.send])

    const { closedAt, messages, total } = conversation

    return <>
        <h1>Conversation</h1>
        <ConversationInfo conversation={conversation} onClose={handleClickClose} onDelete={handleClickDelete} onUpdate={handleClickUpdate} />
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
                    <div>CreatedAt: {m.createdAt.toLocaleString()}</div>
                    {!!m.updatedAt && <div style={{ color: 'green' }}>UpdatedAt: {m.updatedAt.toLocaleString()}</div>}
                    {!!m.deletedAt && <div style={{ color: 'red' }}>DeletedAt: {m.deletedAt.toLocaleString()}</div>}
                    <div>Participants: {m.participants.join(', ')}</div>
                    {!m.deletedAt && m.fromId === user.name && <>
                        <button data-id={m.id} disabled={updating.has(m.id)} onClick={handleClickMessageDelete}>Delete</button>
                        <input type='checkbox' id={'update-' + m.id} data-id={m.id} checked={update.has(m.id)} disabled={updating.has(m.id)} onChange={handleChangeUpdate} />
                        <label htmlFor={'update-' + m.id}>Update</label>
                    </>}
                </div>
                {m.id && !m.deletedAt && update.has(m.id) && <TextMessageEditor id={m.id} type={m.type} data={m.data as FileMessage | TextMessage} ok={messageUpdate} />}
            </div>)}
            <div ref={messagesEndRef} />
        </div>
        {!closedAt && <TextMessageEditor ok={messageSend} />}
    </>
}

export default Messages