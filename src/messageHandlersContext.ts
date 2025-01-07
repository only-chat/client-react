import { createContext } from 'react'

export interface MessageHandlers {
    handlers: ((response: any) => void)[]
    add: (func: (response: any) => void) => void
    remove: (func: (response: any) => void) => void
}

const messageHandlersContext = createContext<MessageHandlers>({
    handlers: [],
    add(func: ((response: any) => void)) {
        this.handlers.push(func)
    },
    remove(func: ((response: any) => void)) {
        const index = this.handlers.indexOf(func)
        if (index >= 0) {
            this.handlers.splice(index, 1)
        }
    },
})

export default messageHandlersContext