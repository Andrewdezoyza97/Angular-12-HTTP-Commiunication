import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpContextToken } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";

import { HttpCacheService } from "./http-cache.service";

export const CACHEABLE =new HttpContextToken(() => true);
@Injectable()

export class CacheInterceptor implements HttpInterceptor {

    constructor(private casheService: HttpCacheService) { }
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        //only cache request configured to be cacheable
        if(!req.context.get(CACHEABLE)){
            return next.handle(req);
        }

        //pass along non-cacheble request and invalidate cache
        if (req.method !== 'GET') {
            console.log(`Invalidating cache : ${req.method} ${req.url}`);
            this.casheService.invalidateCache();
            return next.handle(req);
        }

        //attempt to retrive a cached responswe
        const cacheResponse: HttpResponse<any> = this.casheService.get(req.url);

        // return cached response
        if (cacheResponse) {
            console.log(`Returning a cached response : ${cacheResponse.url}`);
            console.log(cacheResponse);
            return of(cacheResponse);
        }

        // send request to server an add response to cache
        return next.handle(req)
            .pipe(
                tap(event => {
                    if (event instanceof HttpResponse) {
                        console.log(`Adding item to cache : ${req.url}`);
                        this.casheService.put(req.url, event);
                    }
                })
            );
    }
}