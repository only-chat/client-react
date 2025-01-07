import React, { useCallback, useContext, useEffect, useState } from 'react'
import Conversations from './conversations'
import { createConversation } from './conversation'
import { Connect, Close } from './connect'
import Login from './login'
import Messages, { createMessage } from './messages'
import MessageHandlersContext from './messageHandlersContext'
import UserContext from './userContext'
import WatchingConversations from './watch'

import type { MessageType, TextMessage, FileMessage } from './messages'
import type { ConversationData } from './conversation'
import type { ConversationsData } from './conversations'
import type { User } from './userContext'

const App = () => {
    const [wsInstance, setWsInstance] = useState<WebSocket>()
    const [isConnected, setIsConnected] = useState(false)
    const [conversations, setConversations] = useState<ConversationsData>()
    const [watchingConversations, setWatchingConversations] = useState<ConversationsData>()
    const [conversation, setConversation] = useState<ConversationData>()
    const [user, setUser] = useState<User>({})
    const handlers = useContext(MessageHandlersContext)

    const closeConnection = useCallback(() => {
        if (wsInstance && !([WebSocket.CLOSING, WebSocket.CLOSED] as number[]).includes(wsInstance.readyState)) {
            setConversation(undefined)
            setConversations(undefined)
            setWatchingConversations(undefined)
            setIsConnected(false)
            wsInstance.close()
            setWsInstance(undefined)
        }
    }, [wsInstance, setWsInstance])

    const connect = useCallback((h: string) => {
        const ws = new WebSocket(h)
        setWsInstance(ws)
    }, [wsInstance, isConnected])

    const login = useCallback((name: string, password: string) => {
        wsInstance?.send(
            JSON.stringify({ authInfo: { name, password }, conversationsSize: 0 })
        )
        setUser({ name })
    }, [wsInstance, setUser])

    const loadMoreConversations = useCallback((excludeIds?: string[]) => {
        wsInstance?.send(
            JSON.stringify({ type: 'load', data: { size: 1, excludeIds } })
        )
    }, [wsInstance, conversations])

    const loadMoreWatchingConversations = useCallback((ids?: string[], excludeIds?: string[]) => {
        wsInstance?.send(
            JSON.stringify({ type: 'load', data: { size: 1, ids, excludeIds } })
        )
    }, [wsInstance])

    const watch = useCallback(() => {
        setConversations(undefined)
        wsInstance?.send(
            JSON.stringify({ type: 'watch' })
        )
    }, [wsInstance])

    const joinConversation = useCallback((conversationId?: string | null, participants?: string[], title?: string) => {
        wsInstance?.send(
            JSON.stringify({ type: 'join', data: { conversationId, title, messagesSize: 5, participants } })
        )
    }, [wsInstance])

    const updateConversation = useCallback((conversationId: string, participants?: string[], title?: string) => {
        wsInstance?.send(
            JSON.stringify({ type: 'update', data: { conversationId, title, participants } })
        )
    }, [wsInstance])

    const closeConversation = useCallback((conversationId: string) => {
        wsInstance?.send(
            JSON.stringify({ type: 'close', data: { conversationId } })
        )
    }, [wsInstance])

    const deleteConversation = useCallback((conversationId: string) => {
        wsInstance?.send(
            JSON.stringify({ type: 'delete', data: { conversationId } })
        )
    }, [wsInstance])

    const messageUpdate = useCallback((messageId: string, data: FileMessage | TextMessage) => {
        wsInstance?.send(
            JSON.stringify({ type: 'message-update', data: { messageId, ...data } })
        )
    }, [wsInstance])

    const messageDelete = useCallback((messageId: string) => {
        wsInstance?.send(
            JSON.stringify({ type: 'message-delete', data: { messageId } })
        )
    }, [wsInstance])

    const loadMoreMessages = useCallback((before?: Date, excludeIds?: string[]) => {
        wsInstance?.send(
            JSON.stringify({ type: 'load-messages', data: { size: 1, before, excludeIds } })
        )
    }, [wsInstance, conversation])

    const send = useCallback((type: MessageType, data: FileMessage | TextMessage) => {
        wsInstance?.send(
            JSON.stringify({ type, data })
        )
    }, [wsInstance])

    useEffect(() => {
        return () => setWsInstance(undefined)
    }, [])

    useEffect(() => {
        if (!wsInstance) {
            return
        }

        const handleMessage = (event: MessageEvent) => {
            const response = JSON.parse(event.data)
            switch (response.type) {
                case 'hello':
                    setIsConnected(true)
                    break
                case 'connection':
                    setConversations({
                        conversations: response.conversations.conversations?.map(createConversation),
                        total: response.conversations.total,
                    })
                    break
                case 'conversation':
                    setConversation({
                        ...response.conversation,
                        connected: response.connected,
                        messages: response.messages?.messages.reverse().map(createMessage),
                        total: response.messages?.total,
                        leftAt: new Date(response.leftAt),
                    })
                    break
                case 'watching':
                    setWatchingConversations({
                        conversations: response.conversations.conversations?.map(createConversation),
                        total: response.conversations.total,
                    })
                    break
            }

            handlers.handlers.forEach(h => h(response))

            console.debug("WebSocket message: ", event)
        }

        const handleClose = (event: CloseEvent) => {
            setConversation(undefined)
            setConversations(undefined)
            setWatchingConversations(undefined)
            setIsConnected(false)
            setUser({})
            if (event.code === 1000) {
                console.debug("WebSocket closed: ", event)
            } else {
                console.error("WebSocket closed: ", event)
            }
        }

        const handleError = (event: Event) => {
            console.error("WebSocket error: ", event)
        }

        wsInstance.addEventListener('message', handleMessage)
        wsInstance.addEventListener('close', handleClose)
        wsInstance.addEventListener('error', handleError)

        return () => {
            wsInstance.removeEventListener('message', handleMessage)
            wsInstance.removeEventListener('close', handleClose)
            wsInstance.removeEventListener('error', handleError)
        }
    }, [wsInstance, conversation, conversations, watchingConversations, handlers, setConversation, setConversations, setWatchingConversations, setIsConnected, setUser])

    return <UserContext.Provider value={user}>
        {conversation && <Messages {...{ conversation, loadMore: loadMoreMessages, send, update: updateConversation, close: closeConversation, delete: deleteConversation, messageUpdate, messageDelete }} />}
        {!conversation && conversations && <Conversations {...{ conversations, loadMore: loadMoreConversations, watch, join: joinConversation, update: updateConversation, close: closeConversation, delete: deleteConversation }} />}
        {user.name && watchingConversations && <WatchingConversations {...{ conversations: watchingConversations, loadMore: loadMoreWatchingConversations }} />}
        {!conversations && !watchingConversations && isConnected && <Login {...{ login }} />}
        {(!isConnected || !wsInstance) ? <Connect {...{ connect }} /> : <Close close={closeConnection} />}
    </UserContext.Provider>
}

export default App