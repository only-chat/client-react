import React, { useState } from 'react'

interface ConnectProps {
    connect: (host: string) => void
}

interface CloseProps {
    close: () => void
}

export const Connect = (props: ConnectProps) => {
    const [host, setHost] = useState('http://localhost:9000')

    const handleClickConnect = (e: React.MouseEvent) => {
        props.connect(host)
    }

    const handleHostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHost(e.target.value)
    }

    const htmlFor = 'username'
    return <>
        <h1>Connect</h1>
        <div>
            <label htmlFor={htmlFor}>Host:</label>
            <input id={htmlFor} value={host} onChange={handleHostChange} />
        </div>
        <button onClick={handleClickConnect}>Connect</button>
    </>
}

export const Close = (props: CloseProps) => {
    const handleClickClose = (e: React.MouseEvent) => {
        props.close()
    }

    return <div>
        <button onClick={handleClickClose}>Close connection</button>
    </div>
}