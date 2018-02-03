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
    public filters: [ExPriceFilter, ExLotSizeFilter, ExMinNotionalFilter];
}

export class ExPriceFilter {
    public filterType: string;
    public minPrice: string;
    public maxPrice: string;
    public tickSize: string;
}

export class ExLotSizeFilter {
    public filterTypestring;
    public minQty: string;
    public maxQty: string;
    public stepSize: string;
}

export class ExMinNotionalFilter {
    public filterType: string;
    public minNotional: string;
}
