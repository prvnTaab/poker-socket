import { Global, Module } from "@nestjs/common";
import { UtilsService } from "./utils.service";
import { SocketQueryService } from "./socketQuery.service";


@Global()
@Module({

    imports: [],
    controllers: [],
    providers: [UtilsService,SocketQueryService]

})
export class UtilsModule {}