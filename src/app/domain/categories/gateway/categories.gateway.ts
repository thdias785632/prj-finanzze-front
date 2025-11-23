import { Observable } from "rxjs";
import { Categories } from "../dto/categories.dto";

export abstract class CategoriesGateway {
    abstract createCategory(category: Categories): Observable<void>;
    abstract getCategoriesByUserId(userId: string): Observable<Categories[]>;
}