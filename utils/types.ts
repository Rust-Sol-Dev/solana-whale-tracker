export type IPairInfo = {
  [key: string]: {
    address: string,
    decimals: string,
    name?: string,
    symbol?: string,
    uri?: string,
    image?: string,
    desc?: string,
  }
}

export interface IToken {
  address:string
  name :string
  symbol:string
}

export interface IPair {
  pairAddress:string
  baseToken:IToken
  quotoeToken:IToken
  topTraders?:string[]
}