import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CardGateway } from "../../domain/card/gateway/card.gateway";
import { Card, CardExpensses, CardsExtract } from "../../domain/card/dto/card.dto";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class CardService implements CardGateway {
  private apiUrl = environment.apiUrl;

  constructor(
    private httpServer: HttpClient
  ) { }

  createCardEspensses(cardExpensess: CardExpensses): Observable<void> {
    return this.httpServer.post<void>(
      `${this.apiUrl}/card-expenses`, cardExpensess
    );
  }

  updateCardEspensses(cardExpensess: CardExpensses): Observable<void> {
    return this.httpServer.put<void>(
      `${this.apiUrl}/card-expenses`, cardExpensess
    );
  }

  deleteCardExpensses(id: string): Observable<void> {
    return this.httpServer.delete<void>(
      `${this.apiUrl}/card-expenses/?id=${id}`, {});
  }

  getCardsByUserId(userId: string): Observable<Card[]> {
    return this.httpServer.get<Card[]>(
      `${this.apiUrl}/card/get-by-user?userId=${userId}`
    );
  }

  getCardsExtract(userId: string, referenceDate: string): Observable<CardsExtract[]> {
    return this.httpServer.get<CardsExtract[]>(
      `${this.apiUrl}/extract/complete-cards-extract?userId=${userId}&month=${referenceDate}`
    );
  }

  createCard(card: Card): Observable<Card> {
    return this.httpServer.post<Card>(
      `${this.apiUrl}/card`, card
    );
  }
}