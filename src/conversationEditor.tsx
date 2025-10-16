import React, { useState } from 'react'

interface ConversationEditorProps {
    title: string
    participants: string
    ok: (participants?: string[], title?: string) => void
}

const ConversationEditor = (props: ConversationEditorProps) => {
    const [title, setTitle] = useState(props.title)
    const [participants, setParticipants] = useState(props.participants)
    const [updating, setUpdating] = useState(false)

    const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value)
    }

    const handleChangeParticipans = (e: React.ChangeEvent<HTMLInputElement>) => {
        setParticipants(e.target.value)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleClick = (e: React.MouseEvent) => {
        setUpdating(true)
        props.ok(participants.split(',').filter(s => s.trim()), title)
    }

    return <div style={{ display: 'inline-block', marginLeft: 20 }}>
        {updating && <div>Updating ...</div>}
        <div>
            <label htmlFor='new-title'>New title:</label>
            <input id='new-title' type='text' value={title} onChange={handleChangeTitle} disabled={updating} />
        </div>
        <div>
            <label htmlFor='new-participants'>New participants:</label>
            <input id='new-participants' type='text' value={participants} onChange={handleChangeParticipans} disabled={updating} />
        </div>
        <button onClick={handleClick} disabled={updating}>OK</button>
    </div>
}

export default ConversationEditor