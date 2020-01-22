/*
+-------------------+----------------------------------------------+
| Type	            |   Additional mandatory parameters            |
| ------------------+----------------------------------------------+
| LIMIT	            |   timeInForce, quantity, price               |
| MARKET	        |   quantity                                   |
| STOP_LOSS	        |   quantity, stopPrice                        |
| STOP_LOSS_LIMIT	|   timeInForce, quantity, price, stopPrice    |
| TAKE_PROFIT	    |   quantity, stopPrice                        |
| TAKE_PROFIT_LIMIT |	timeInForce, quantity, price, stopPrice    |
| LIMIT_MAKER	    |   quantity, price                            |
+-------------------+----------------------------------------------+
*/

import { NewOrderInterface } from '../interfaces/newOrder.interface';
import { BinanceEnum } from '../enums/binance.enum';
import Logger from '../logger';

export class NewOrder implements NewOrderInterface {
    // Valeur obligatoire
    public symbol: string;
    public side: BinanceEnum;
    public type: BinanceEnum;
    public quantity: number;
    public timestamp: number;

    // Valeur optionnelle
    public timeInForce: BinanceEnum;
    public price: number;
    public newClientOrderId: string;       // A unique id for the order. Automatically generated if not sent.
    public stopPrice: number;              // Used with STOP_LOSS, STOP_LOSS_LIMIT, TAKE_PROFIT, and
                                           // TAKE_PROFIT_LIMIT orders.
    public icebergQty: number;
    public newOrderRespType: BinanceEnum;  // Set the response JSON. ACK, RESULT, or FULL; default: RESULT.
    public recvWindow: number;

    constructor(newOrder: NewOrderInterface) {
        this.symbol = newOrder.symbol;
        this.side = newOrder.side;
        this.type = newOrder.type;
        this.quantity = newOrder.quantity;
        this.timestamp = newOrder.timestamp;
    }

    public getParameters(): any {
        const params = {};
        for (const attribute in this) {
            if (this.hasOwnProperty(attribute)) {
                params[attribute.toString()] = this[attribute];
            }
        }

        return params;
    }
}
