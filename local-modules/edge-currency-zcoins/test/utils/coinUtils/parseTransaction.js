// @flow

import { expect } from 'chai'
import { describe, it } from 'mocha'

import { parseTransaction } from '../../../src/utils/coinUtils.js'

describe('parseTransaction', function () {
  it('Matches a known transaction', function () {
    // txid 98b83856161f16f877194e0d80167bff0eb853fda89c2401ca2d99ee4676eca2
    const txData =
      '0100000001e7a4a70f71e090157bc7c1b47ee83af56beb3579d8fa24110a97d1ee717d9afb010000006b483045022100de863ece760a873d673851f9c81ed148519dfc237d3fd7d43600896d5c5ba651022003e1620cdbbca12596a34fc97495486eb3f8f523453cb031ac531d623af4c7430121038600604184c04d944cd711e08a903043961a8a01d32e738beec1937dea75ae35ffffffff0277060000000000001976a91491c5eab4339b77e897005c3fcf0c123c62fccf9988ac53150000000000001976a914f783b9f78fe45bae833babfa5f2ebf10dd0cb79788ac00000000'
    const expected = {
      inputs: [
        {
          txid:
            'fb9a7d71eed1970a1124fad87935eb6bf53ae87eb4c1c77b1590e0710fa7a4e7',
          index: 1
        }
      ],
      outputs: [
        {
          // displayAddress: '1EHn5KN3P71xTsZseTnNCRjfBhPCdw5To4'
          scriptHash:
            'b44600cd86fe9aa07b69417c81b8e59bd26a6965cba19882b9c7b001b98df1fa',
          value: 1655
        },
        {
          // displayAddress: '1PZjhtvQHmUgtoqcNTri7jn2NBq3d5QhBj'
          scriptHash:
            '052c80d8ec3d76cabca31765e54ee5bcce26125a459ce10f1775d0608f203463',
          value: 5459
        }
      ]
    }
    const parsedData: any = parseTransaction(txData)
    expect(parsedData.inputs[0].prevout.rhash()).to.equal(
      expected.inputs[0].txid
    )
    expect(parsedData.inputs[0].prevout.index).to.equal(
      expected.inputs[0].index
    )
    expect(parsedData.outputs[0].scriptHash).to.equal(
      expected.outputs[0].scriptHash
    )
    expect(parsedData.outputs[0].value).to.equal(expected.outputs[0].value)
    expect(parsedData.outputs[1].scriptHash).to.equal(
      expected.outputs[1].scriptHash
    )
    expect(parsedData.outputs[1].value).to.equal(expected.outputs[1].value)
  })

  it('Handles Bitcoin genesis transaction', function () {
    // txid 4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b
    const txData =
      '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff4d04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac00000000'
    const expected = {
      inputs: [
        {
          txid:
            '0000000000000000000000000000000000000000000000000000000000000000',
          index: 4294967295
        }
      ],
      outputs: [
        {
          // displayAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
          scriptHash:
            '740485f380ff6379d11ef6fe7d7cdd68aea7f8bd0d953d9fdf3531fb7d531833',
          value: 5000000000
        }
      ]
    }
    const parsedData: any = parseTransaction(txData)
    expect(parsedData.inputs[0].prevout.rhash()).to.equal(
      expected.inputs[0].txid
    )
    expect(parsedData.inputs[0].prevout.index).to.equal(
      expected.inputs[0].index
    )
    expect(parsedData.outputs[0].scriptHash).to.equal(
      expected.outputs[0].scriptHash
    )
    expect(parsedData.outputs[0].value).to.equal(expected.outputs[0].value)
  })
})
