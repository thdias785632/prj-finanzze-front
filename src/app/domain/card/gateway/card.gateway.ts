import { Observable } from "rxjs";
import { Card, CardExpensses, CardsExtract } from "../dto/card.dto";

export abstract class CardGateway {
    abstract createCardEspensses(cardExpensses: CardExpensses): Observable<void>;
    abstract deleteCardExpensses(id: string): Observable<void>;
    abstract getCardsByUserId(userId: string): Observable<Card[]>;
    abstract getCardsExtract(cardId: string, referenceDate: string): Observable<CardsExtract[]>;
    abstract createCard(card: Card): Observable<Card>;
}