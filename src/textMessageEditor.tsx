import React, { useEffect, useState } from 'react'
import type { MessageType, FileMessage, TextMessage } from './messages'

interface TextMessageProps {
    id?: string
    type?: MessageType
    data?: FileMessage | TextMessage
    ok: (id: string | undefined, type: MessageType, data: FileMessage | TextMessage) => void
}

const textType: MessageType = 'text'
const fileType: MessageType = 'file'

const TextMessageEditor = (props: TextMessageProps) => {
    const [messageType, setMessageType] = useState(props.type ?? textType)

    const textData = props.type === textType ? props.data as TextMessage : undefined

    const [text, setText] = useState(textData?.text ?? '')

    const fileData = props.type === 'file' ? props.data as FileMessage : undefined

    const [link, setLink] = useState(fileData?.link ?? '')
    const [name, setName] = useState(fileData?.name ?? '')
    const [type, setType] = useState(fileData?.type ?? '')
    const [size, setSize] = useState(fileData?.size)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        setUpdating(false)
    }, [setUpdating])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value)
    }

    const handleChangeLink = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLink(e.target.value)
    }

    const handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
    }

    const handleChangeType = (e: React.ChangeEvent<HTMLInputElement>) => {
        setType(e.target.value)
    }

    const handleChangeSize = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSize(Number(e.target.value))
    }

    const t = props.type ?? messageType

    const handleClick = (e: React.MouseEvent) => {
        if (props.id) {
            setUpdating(true)
        }

        switch (t) {
            case textType:
                props.ok(props.id, t, { text } as TextMessage)
                break
            case fileType:
                props.ok(props.id, t, { link, name, type: type || undefined, size } as FileMessage)
                break
            default:
                setUpdating(false)
        }
    }

    const propsId = props.id ?? ''
    const htmlForText = 'message-text' + propsId
    const htmlForLink = 'message-link' + propsId
    const htmlForName = 'message-name' + propsId
    const htmlForType = 'message-type' + propsId
    const htmlForSize = 'message-size' + propsId

    const sendDisabled = updating || (t === textType && !text)
        || (t === fileType && (!link || !name))

    return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {!props.type && <fieldset disabled={updating}>
            <legend>Message type:</legend>
            <input type="radio" id="text" value={textType} checked={messageType === textType} onChange={e => setMessageType(textType)} />
            <label htmlFor="text">text</label>
            <input type="radio" id="file" value={fileType} checked={messageType === fileType} onChange={e => setMessageType(fileType)} />
            <label htmlFor="file">file</label>
        </fieldset>}
        {messageType === fileType && <>
            <label htmlFor={htmlForLink}>Link:</label>
            <input id={htmlForLink} value={link} onChange={handleChangeLink} disabled={updating} />
            <label htmlFor={htmlForName}>Name:</label>
            <input id={htmlForName} value={name} onChange={handleChangeName} disabled={updating} />
            <label htmlFor={htmlForType}>Type:</label>
            <input id={htmlForType} value={type} onChange={handleChangeType} disabled={updating} />
            <label htmlFor={htmlForSize}>Size (Bytes):</label>
            <input id={htmlForSize} type="number" min={0} value={size} onChange={handleChangeSize} disabled={updating} />
        </>}
        {messageType === textType && <>
            <label htmlFor={htmlForText}>Text:</label>
            <textarea id={htmlForText} placeholder='Type your message here...' value={text} onChange={handleChange} rows={3} disabled={updating} />
        </>}
        <button onClick={handleClick} disabled={sendDisabled}>{props.id ? 'OK' : 'Send'}</button>
    </div>
}

export default TextMessageEditor