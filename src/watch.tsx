import React, { useContext, useEffect, useState } from 'react'
import { createConversation, createMessage } from './responses'

import UserContext from './userContext'
import MessageHandlersContext, { type Action } from './messageHandlersContext'

import type { ConversationsData } from './conversations'
import type {
    ConversationClosedResponse,
    ConversationDeletedResponse,
    ConversationUpdatedResponse,
    LoadedConversationsResponse,
    FileMessageResponse,
    JoinedResponse,
    LeftResponse,
    MessageDeletedResponse,
    MessageUpdatedResponse,
    TextMessageResponse,
} from './responses'

type Response = ConversationClosedResponse | ConversationDeletedResponse | ConversationUpdatedResponse | FileMessageResponse | JoinedResponse | LeftResponse | LoadedConversationsResponse | MessageDeletedResponse | MessageUpdatedResponse | TextMessageResponse

interface WatchConversationsProps {
    conversations: ConversationsData
    loadMore: (ids?: string[], excludeIds?: string[]) => void
}

const WatchingConversations = (props: WatchConversationsProps) => {
    const user = useContext(UserContext)
    const handlers = useContext(MessageHandlersContext)
    const [conversations, setConversations] = useState<ConversationsData>(props.conversations)

    const propsLoadMore = props.loadMore

    useEffect(() => {
        const handleMessage = (response: Response) => {
            if (response.type === 'loaded') {
                const loaded = response.conversations?.map(createConversation)
                const count = response.count

                const updated = { ...conversations }

                if (loaded?.length && count) {
                    if (updated.total && updated.conversations?.length) {
                        updated.total = updated.conversations.length + count
                        updated.conversations = loaded.concat(updated.conversations)
                    } else {
                        updated.conversations = loaded
                        updated.total = count
                    }
                } else {
                    updated.total = updated.conversations?.length ?? 0
                }

                setConversations(updated)
                return
            }

            if (!response.conversationId) {
                return
            }

            if (!conversations) {
                return
            }

            const conversation = conversations.conversations.find(c => c.id === response.conversationId)

            if (!conversation) {
                if (!response.participants || response.participants.includes(user.name!)) {
                    propsLoadMore([response.conversationId])
                }

                return
            }

            switch (response.type) {
                case 'closed':
                    conversation.closedAt = new Date(response.data.closedAt)
                    setConversations({ ...conversations })
                    break
                case 'deleted':
                    conversation.closedAt = new Date(response.data.closedAt)
                    conversation.deletedAt = new Date(response.data.deletedAt)
                    setConversations({ ...conversations })
                    break
                case 'joined':
                    if (!conversation.connected?.includes(response.fromId)) {
                        conversation.connected = [response.fromId, ...(conversation.connected ?? [])]
                        setConversations({ ...conversations })
                    }
                    break
                case 'left':
                    if (conversation.connected?.includes(response.fromId)) {
                        conversation.connected = conversation.connected.filter(id => id !== response.fromId)
                        setConversations({ ...conversations })
                    }
                    break
                case 'message-deleted':
                    {
                        const { messageId, deletedAt } = response.data
                        if (conversation.latestMessage?.id === messageId) {
                            const deletedMessage = conversation.latestMessage!
                            deletedMessage.deletedAt = new Date(deletedAt)
                            setConversations({ ...conversations })
                        }
                    }
                    break
                case 'message-updated':
                    {
                        const { messageId, updatedAt } = response.data
                        if (conversation.latestMessage?.id === messageId) {
                            const updatedMessage = conversation.latestMessage!

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
                            setConversations({ ...conversations })
                        }
                    }
                    break
                case 'file':
                case 'text':
                    {
                        const msg = createMessage(response)

                        if (conversation.latestMessage) {
                            const dates = [new Date(conversation.latestMessage.createdAt).getTime()]
                            if (conversation.latestMessage.updatedAt) {
                                dates.push(new Date(conversation.latestMessage.updatedAt).getTime())
                            }
                            if (conversation.latestMessage.deletedAt) {
                                dates.push(new Date(conversation.latestMessage.deletedAt).getTime())
                            }
                            const maxDate = Math.max(...dates)
                            if (maxDate <= msg.createdAt.getTime()) {
                                conversation.latestMessage = msg
                                setConversations({ ...conversations })
                            }
                        } else {
                            conversation.latestMessage = msg
                            setConversations({ ...conversations })
                        }
                    }
                    break
                case 'updated':
                    conversation.title = response.data.title
                    conversation.participants = response.data.participants
                    conversation.updatedAt = new Date(response.data.updatedAt)
                    setConversations({ ...conversations })
                    break
            }
        }

        handlers.add(handleMessage as Action)

        return () => {
            handlers.remove(handleMessage as Action)
        }
    }, [conversations, user.name, handlers, propsLoadMore])

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleClickLoad = (e: React.MouseEvent) => {
        propsLoadMore(undefined, conversations?.conversations.map(c => c.id))
    }

    return <>
        <h1>Conversations</h1>
        <button onClick={handleClickLoad} disabled={conversations?.conversations.length === conversations.total}>Load more</button>
        <span> Loaded: {conversations.conversations?.length}</span>
        <span> Total: {conversations.total}</span>
        {conversations?.conversations.map(c =>
            <div key={c.id} style={{ marginTop: 20 }}>
                <div>Id: {c.id}</div>
                <div>Title: {c.title}</div>
                <div>CreatedBy: {c.createdBy}</div>
                <div>CreatedAt: {c.createdAt.toLocaleString()}</div>
                {!!c.updatedAt && <div style={{ color: 'green' }}>UpdatedAt: {c.updatedAt.toLocaleString()}</div>}
                {!!c.closedAt && <div style={{ color: 'darkred' }}>ClosedAt: {c.closedAt.toLocaleString()}</div>}
                {!!c.deletedAt && <div style={{ color: 'red' }}>DeletedAt: {c.deletedAt.toLocaleString()}</div>}
                <div>Participants: {c.participants.join(', ')}</div>
                {!!c.latestMessage && <div>{JSON.stringify(c.latestMessage.data)}</div>}
                {!!c.connected?.length && <div>Connected: {c.connected.join(', ')}</div>}
            </div>)}
    </>
}

export default WatchingConversations