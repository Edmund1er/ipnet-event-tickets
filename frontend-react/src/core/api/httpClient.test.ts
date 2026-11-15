import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, urlBlob } from './httpClient'

const descripteurOriginal = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')

afterEach(() => {
  vi.restoreAllMocks()
  if (descripteurOriginal) Object.defineProperty(URL, 'createObjectURL', descripteurOriginal)
  else Reflect.deleteProperty(URL, 'createObjectURL')
})

describe('urlBlob', () => {
  it('demande un contenu image plutôt que le JSON par défaut du client', async () => {
    const creerUrl = vi.fn().mockReturnValue('blob:billet-qr')
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: creerUrl })
    const obtenir = vi.spyOn(http, 'get').mockResolvedValue({ data: new Blob(['png']) } as never)

    await expect(urlBlob('/billets/id/qr')).resolves.toBe('blob:billet-qr')

    expect(obtenir).toHaveBeenCalledWith('/billets/id/qr', {
      responseType: 'blob',
      headers: { Accept: 'image/*, application/octet-stream;q=0.9, */*;q=0.8' },
    })
    expect(creerUrl).toHaveBeenCalledOnce()
  })
})
