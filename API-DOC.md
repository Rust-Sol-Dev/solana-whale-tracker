# Whale Tracker Backend API

Server Origin Url: [http://45.61.162.38:9000](http://45.61.162.38:9000)

## API List

### Ping
- Method: GET
- Endpoint: `{server_origin_url}/api/tokens`
- Return: Endpoint status

### Get Pair
- Method: GET
- Endpoint: `{server_origin_url}/api/tokens/pair`
- Params:
  - `baseToken`: string
    - **require**: valid Solana address
  - `quoteToken` ?: string
    - **require**: valid Solana address
  - **ref**: 
    - If `quoteToken` is set, fetch all pairs of `baseToken` and `quoteToken`. 
    - If `quoteToken` is not set, fetch all pairs of `baseToken`.
- Return schema:
  ```json
  [
    {
      "chainId": "string",
      "dexId": "string",
      "url": "string",
      "pairAddress": "string",
      "baseToken": {
        "address": "string",
        "name": "string",
        "symbol": "string"
      },
      "quoteToken": {
        "address": "string",
        "name": "string",
        "symbol": "string"
      },
      "priceNative": "string",
      "priceUsd": "string",
      "txns": {
        "m5": {
          "buys": "number",
          "sells": "number"
        },
        "h1": {
          "buys": "number",
          "sells": "number"
        },
        "h6": {
          "buys": "number",
          "sells": "number"
        },
        "h24": {
          "buys": "number",
          "sells": "number"
        }
      },
      "volume": {
        "h24": "number",
        "h6": "number",
        "h1": "number",
        "m5": "number"
      },
      "priceChange": {
        "m5": "number",
        "h1": "number",
        "h6": "number",
        "h24": "number"
      },
      "liquidity": {
        "usd": "number",
        "base": "number",
        "quote": "number"
      },
      "fdv": "number",
      "pairCreatedAt": "number",
      "info": {
        "imageUrl": "string",
        "websites": [
          {
            "label": "string",
            "url": "string"
          }
        ],
        "socials": [
          {
            "type": "string",
            "url": "string"
          }
        ]
      }
    }
  ]
  ```

### Get Top Holders List
- Method: GET
- Endpoint: `{server_origin_url}/api/tokens/topholders`
- Params:
  - tokenMint: string
    - **require**: valid Solana address
- Return schema:
  ```json
  [
    {
    "address": "string",
    "amount": "string",
    "decimals": "number",
    "uiAmount": "number",
    "uiAmountString": "string"
    }
  ]
  ```

### Get Top Traders List
- Method: GET
- Endpoint: `{server_origin_url}/api/tokens/toptraders`
- Params:
  - token: string
    - **require**: valid Solana address
- Return schema:
  ```json
  {
    "data": [
      {
        "pairAddress": "string",
        "baseToken": {
          "address": "string",
          "name": "string",
          "symbol": "string"
        },
        "quoteToken": {
          "address": "string",
          "name": "string",
          "symbol": "string"
        },
        "topTraders": ["string"]
      }
    ],
    "whaleList": ["string"]
  }
  ```