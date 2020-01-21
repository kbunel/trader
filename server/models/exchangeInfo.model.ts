// https://github.com/binance-exchange/binance-official-api-docs/blob/master/rest-api.md#exchange-information

export class ExchangeInfo {
    public timezone: string;
    public serverTime: number;
    public rateLimits: ExRateLimit[];
    public exchangeFilters: any; // Didnt retrieve any informations abt this yet.
    public symbols: ExSymbol[];
}

export class ExRateLimit {
    public rateLimitType: string;
    public interval: string;
    public limit: number;
}

export class ExSymbol {
    public symbol: string;
    public status: string;
    public baseAsset: string;
    public baseAssetPrecision: number;
    public quoteAsset: string;
    public quotePrecision: number;
    public orderTypes: string[];
    public icebergAllowed: boolean;
    public filters; // cf ci-dessous for a list of filter, can evolve with time
}

export class ExPriceFilter {
    public static filterType: string = 'PRICE_FILTER';
    public minPrice: string;
    public maxPrice: string;
    public tickSize: string;
}

export class ExPercentPriceFilter {
  public static filterType: string = 'PERCENT_PRICE';
  public multiplierUp: string;
  public multiplierDown: string;
  public avgPriceMins: number;
}

export class ExLotSizeFilter {
    public static filterType = 'LOT_SIZE';
    public minQty: string;
    public maxQty: string;
    public stepSize: string;
}

export class ExMinNotionalFilter {
    public static filterType: string = 'MIN_NOTIONAL';
    public minNotional: string;
}

export class ExIcebergPartFilter {
  public static filterType: string = 'ICEBERG_PARTS';
  public limit: number;
}

export class ExMarketLotSize {
  public static filterType: string = 'MARKET_LOT_SIZE';
  public minQty: string;
  public maxQty: string;
  public stepSize: string;
}

export class ExMaxNumAlgoOrders {
  public readonly filterType: string = 'MAX_NUM_ALGO_ORDERS';
  public maxNumAlgoOrders: number;
}
