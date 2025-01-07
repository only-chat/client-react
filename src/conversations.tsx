import React, { memo, useCallback, useContext, useState, useEffect } from 'react'
import ConversationInfo, { type Conversation, type ConversationData, createConversation } from './conversation'
import MessageHandlersContext from './messageHandlersContext'

export interface ConversationsData {
    conversations: ConversationData[]
    total: number,
}

interface ConversationsProps {
    conversations: ConversationsData
    loadMore: (excludeIds?: string[]) => void
    watch: () => void
    join: (id: string | null, participants?: string[], title?: string) => void
    update: (id: string, participants?: string[], title?: string) => void
    close: (id: string) => void
    delete: (id: string) => void
}

interface ConversationProps {
    conversations: Conversation[]
    onJoin: (id: string) => void
    onUpdate: (id: string, participants?: string[], title?: string) => void
    onClose: (id: string) => void
    onDelete: (id: string) => void
}

const MemoizedConversations = memo((props: ConversationProps) => <>
    {props.conversations.map(c => <ConversationInfo key={c.id} conversation={c} onClose={props.onClose} onDelete={props.onDelete} onUpdate={props.onUpdate} onJoin={props.onJoin} />)}
</>)

MemoizedConversations.displayName = 'MemoizedConversations'

const Conversations = (props: ConversationsProps) => {
    const handlers = useContext(MessageHandlersContext)
    const [conversations, setConversations] = useState<ConversationsData>(props.conversations)
    const [participants, setParticipants] = useState('')
    const [title, setTitle] = useState('')

    useEffect(() => {
        const handleMessage = (response: any) => {
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

            if (!response.data?.conversationId) {
                return
            }

            const index = conversations.conversations.findIndex(c => c.id === response.data.conversationId)

            if (index < 0) {
                return
            }

            switch (response.type) {
                case 'closed':
                    setConversations({
                        total: conversations.total,
                        conversations: [...conversations.conversations.slice(0, index), {
                            ...conversations.conversations[index],
                            closedAt: new Date(response.data.closedAt),
                        }, ...conversations.conversations.slice(index + 1)],
                    })
                    break
                case 'deleted':
                    setConversations({
                        total: conversations.total,
                        conversations: [...conversations.conversations.slice(0, index), {
                            ...conversations.conversations[index],
                            closedAt: new Date(response.data.closedAt),
                            deletedAt: new Date(response.data.deletedAt),
                        }, ...conversations.conversations.slice(index + 1)],
                    })
                    break
                case 'updated':
                    setConversations({
                        total: conversations.total,
                        conversations: [...conversations.conversations.slice(0, index), {
                            ...conversations.conversations[index],
                            title: response.data.title,
                            participants: response.data.participants,
                            updatedAt: new Date(response.data.updatedAt)
                        }, ...conversations.conversations.slice(index + 1)],
                    })
                    break
            }
        }

        handlers.add(handleMessage)

        return () => {
            handlers.remove(handleMessage)
        }
    }, [conversations, handlers])

    const handleChangeParticipants = (e: React.ChangeEvent<HTMLInputElement>) => {
        setParticipants(e.target.value)
    }

    const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value)
    }

    const handleClickLoad = (e: React.MouseEvent) => {
        props.loadMore(conversations?.conversations.map(c => c.id))
    }

    const handleClickWatch = (e: React.MouseEvent) => {
        props.watch()
    }

    const handleClickJoin = useCallback((id: string) => {
        props.join(id)
    }, [props.join])

    const handleClickUpdate = useCallback((id: string, participants?: string[], title?: string) => {
        props.update(id, participants, title)
    }, [props.update])

    const handleClickClose = useCallback((id: string) => {
        props.close(id)
    }, [props.close])

    const handleClickDelete = useCallback((id: string) => {
        props.delete(id)
    }, [props.delete])

    const handleClickCreate = useCallback((e: React.MouseEvent) => {
        props.join(null, participants.split(',').filter(s => s.trim()), title)
    }, [props.join, participants])

    return <>
        <h1>Conversations</h1>
        <button onClick={handleClickLoad} disabled={conversations.conversations?.length === conversations.total}>Load more</button>
        <span> Loaded: {conversations.conversations?.length}</span>
        <span> Total: {conversations.total}</span>
        <MemoizedConversations conversations={conversations.conversations} onJoin={handleClickJoin} onUpdate={handleClickUpdate} onClose={handleClickClose} onDelete={handleClickDelete} />
        <div>
            <label htmlFor="title-input">Title:</label>
            <input type="text" id="title-input" placeholder="Type title here..." size={50} onChange={handleChangeTitle} />
            <label htmlFor="participants-input">Participants:</label>
            <input type="text" id="participants-input" placeholder="Type your participants here..." size={50} onChange={handleChangeParticipants} />
            <button onClick={handleClickCreate}>Create</button>
        </div>
        <button onClick={handleClickWatch} >Watch</button>
    </>
}

export default Conversations