import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import App from '../app'

test('renders App', () => {
  process.env.WS_HOST = 'http://github.com/only-chat/ws';
  const { container } = render(<App />)
  const element = screen.getAllByText('Connect')
  expect(element).toHaveLength(2)
  expect(element[0]).toBeInTheDocument()
  expect(element[1]).toBeInTheDocument()
  expect(container).toMatchSnapshot();
});
