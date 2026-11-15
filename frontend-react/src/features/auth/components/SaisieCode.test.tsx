import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { SaisieCode } from './SaisieCode'

function Harness() {
  const [code, setCode] = useState('')
  return <SaisieCode valeur={code} surChangement={setCode} />
}

describe('SaisieCode', () => {
  it('distribue les six chiffres reçus en un seul événement autofill', () => {
    render(<Harness />)
    fireEvent.change(screen.getByLabelText('Chiffre 1'), { target: { value: '048271' } })
    expect(screen.getAllByLabelText(/Chiffre/).map((input) => (input as HTMLInputElement).value)).toEqual(['0', '4', '8', '2', '7', '1'])
  })

  it('filtre les caractères non numériques d’un collage', () => {
    render(<Harness />)
    fireEvent.change(screen.getByLabelText('Chiffre 1'), { target: { value: '0a4-8271x' } })
    expect(screen.getAllByLabelText(/Chiffre/).map((input) => (input as HTMLInputElement).value)).toEqual(['0', '4', '8', '2', '7', '1'])
  })
})
