import { describe, expect, it } from 'vitest'
import CollaborationRequest from './CollaborationRequest.js'

describe('CollaborationRequest duplicate protection', () => {
  it('uses a partial unique index to prevent concurrent pending duplicates', () => {
    const pendingIndex = CollaborationRequest.schema.indexes().find(
      ([fields, options]) => fields.sender === 1
        && fields.receiver === 1
        && fields.startup === 1
        && options.unique
    )

    expect(pendingIndex?.[1].partialFilterExpression).toEqual({ status: 'pending' })
  })
})
