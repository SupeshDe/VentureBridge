import { describe, it, expect } from 'vitest'
import { formatCurrency, formatLakhs, getGreeting, initials } from '../utils/format'

describe('utils', () => {
  it('formats currency', () => {
    expect(formatCurrency(100000)).toContain('1,00,000')
  })
  it('formats funding amounts in lakhs and crores', () => {
    expect(formatLakhs(9900000)).toBe('₹99L')
    expect(formatLakhs(10000000)).toBe('₹1Cr')
    expect(formatLakhs(12500000)).toBe('₹1.25Cr')
  })
  it('keeps amounts below one crore below 100 lakhs', () => {
    expect(formatLakhs(9999999)).toBe('₹99.99L')
  })
  it('initials', () => {
    expect(initials('Venture Bridge')).toBe('VB')
    expect(initials('')).toBe('VB')
  })
  it('greets according to the local time of day', () => {
    expect(getGreeting(8)).toBe('Good morning')
    expect(getGreeting(12)).toBe('Good afternoon')
    expect(getGreeting(16)).toBe('Good afternoon')
    expect(getGreeting(17)).toBe('Good evening')
    expect(getGreeting(23)).toBe('Good evening')
  })
})
