import { createContext } from 'react'
import type {ServerResponse, MessageResponse} from './responses'

export type Action = (response: ServerResponse | MessageResponse) => void

export interface MessageHandlers {
    handlers: Action[]
    add: (func: Action) => void
    remove: (func: Action) => void
}

const messageHandlersContext = createContext<MessageHandlers>({
    handlers: [],
    add(func: Action) {
        this.handlers.push(func)
    },
    remove(func: Action) {
        const index = this.handlers.indexOf(func)
        if (index >= 0) {
            this.handlers.splice(index, 1)
        }
    },
})

export default messageHandlersContext