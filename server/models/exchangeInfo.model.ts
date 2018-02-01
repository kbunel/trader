// https://github.com/binance-exchange/binance-official-api-docs/blob/master/rest-api.md#exchange-information

export class ExchangeInfo {
    public timezone: string;
    public serverTime: number;
    public rateLimits: RateLimit[];
    public exchangeFilters: any; // Didnt retrieve any informations abt this yet.
    public symbols: Symbol[];
}

class RateLimit {
    public rateLimitType: string;
    public interval: string;
    public limit: number;
}

class Symbol {
    public symbol: string;
    public status: string;
    public baseAsset: string;
    public baseAssetPrecision: number;
    public quoteAsset: string;
    public quotePrecision: number;
    public orderTypes: string[];
    public icebergAllowed: boolean;
    public filters: [PriceFilter, LotSizeFilter, MinNotionalFilter];
}

class PriceFilter {
    public filterType: string;
    public minPrice: string;
    public maxPrice: string;
    public tickSize: string;
}

class LotSizeFilter {
    public filterTypestring;
    public minQty: string;
    public maxQty: string;
    public stepSize: string;
}

class MinNotionalFilter {
    public filterType: string;
    public minNotional: string;
}
