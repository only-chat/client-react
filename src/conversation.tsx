import React, { useCallback, useContext, useEffect, useState } from 'react'
import ConversationEditor from './conversationEditor'
import { Message, createMessage } from './messages'
import UserContext from './userContext'

export interface Conversation {
    id: string
    clientConversationId?: string
    title?: string
    participants: string[]
    createdBy: string
    createdAt: Date
    updatedAt?: Date
    closedAt?: Date
    deletedAt?: Date
    latestMessage?: Message
    leftAt?: Date
}

export interface ConversationData extends Conversation {
    connected?: string[]
    messages?: Message[]
    total?: number
    leftAt?: Date
}

export const createConversation = (response: any) => ({
    id: response.conversation.id,
    title: response.conversation.title,
    participants: response.conversation.participants,
    createdBy: response.conversation.createdBy,
    createdAt: new Date(response.conversation.createdAt),
    updatedAt: response.conversation.updatedAt ? new Date(response.conversation.updatedAt) : undefined,
    closedAt: response.conversation.closedAt ? new Date(response.conversation.closedAt) : undefined,
    deletedAt: response.conversation.deletedAt ? new Date(response.conversation.deletedAt) : undefined,
    latestMessage: response.latestMessage ? createMessage(response.latestMessage) : undefined,
    leftAt: response.leftAt ? new Date(response.leftAt) : undefined,
    connected: response.connected,
} as Conversation)

interface ConversationInfoProps {
    conversation: ConversationData
    onJoin?: (id: string) => void
    onUpdate: (id: string, participants?: string[], title?: string) => void
    onClose: (id: string) => void
    onDelete: (id: string) => void
}

const ConversationInfo = (props: ConversationInfoProps) => {
    const user = useContext(UserContext)
    const [update, setUpdate] = useState(false)
    const [updating, setUpdating] = useState(false)

    const c = props.conversation

    useEffect(() => {
        setUpdating(false)
        setUpdate(false)
    }, [c, setUpdating, setUpdate])

    const handleClickUpdateOk = useCallback((participants?: string[], title?: string) => {
        setUpdating(true)
        props.onUpdate(c.id, participants, title)
    }, [c.id, props.onUpdate, setUpdating])

    const handleClickClose = (e: React.MouseEvent) => {
        setUpdating(true)
        props.onClose(e.currentTarget.getAttribute('data-id')!)
    }

    const handleClickDelete = (e: React.MouseEvent) => {
        setUpdating(true)
        props.onDelete(e.currentTarget.getAttribute('data-id')!)
    }

    const handleClickJoin = (e: React.MouseEvent) => {
        if (!props.onJoin) {
            return
        }
        setUpdating(true)
        props.onJoin(e.currentTarget.getAttribute('data-id')!)
    }

    const participantsText = c.participants?.join(', ')

    const htmlFor = 'update-c-' + c.id

    return <div>
        <div style={{ display: 'inline-block' }}>
            <div>Id: {c.id}</div>
            <div>Title: {c.title}</div>
            <div>CreatedBy: {c.createdBy}</div>
            <div>CreatedAt: {c.createdAt.toLocaleString()}</div>
            {!!c.updatedAt && <div style={{ color: 'green' }}>UpdatedAt: {c.updatedAt.toLocaleString()}</div>}
            {!!c.closedAt && <div style={{ color: 'darkred' }}>ClosedAt: {c.closedAt.toLocaleString()}</div>}
            {!!c.deletedAt && <div style={{ color: 'red' }}>DeletedAt: {c.deletedAt.toLocaleString()}</div>}
            <div>Participants: {c.participants.join(', ')}</div>
            {!!c.connected?.length && <div>Connected: {c.connected.join(', ')}</div>}
            {!c.deletedAt && <>
                {!!props.onJoin && <button onClick={handleClickJoin} data-id={c.id} disabled={updating}>Join</button>}
                {c.createdBy === user?.name && <>
                    {!c.closedAt && <button onClick={handleClickClose} data-id={c.id} disabled={!!c.closedAt || updating}>Close</button>}
                    {!c.deletedAt && <button onClick={handleClickDelete} data-id={c.id} disabled={updating}>Delete</button>}
                    <input id={htmlFor} type='checkbox' checked={update} disabled={updating} onChange={e => setUpdate(!update)} />
                    <label htmlFor={htmlFor}>Update</label>
                </>}
            </>}
        </div>
        {update && <ConversationEditor title={c.title ?? ''} participants={participantsText} ok={handleClickUpdateOk} />}
    </div>
}

export default ConversationInfo