import systemConfig from './systemConfig.json';

interface StateOfX {
    gameDetails: {
        name: string;
    };
    OFCstartGameEvent: {
        sit: string;
        gameOver: string;
        addPoints: string;
    };
    startGameEvent: {
        sit: string;
        gameOver: string;
        resume: string;
        addChips: string;
        tournament: string;
        tournamentAfterBreak: string;
        handAfterBreak: string;
    };
    startGameEventOnChannel: {
        idle: string;
        starting: string;
        running: string;
    };
    gameState: {
        idle: string;
        starting: string;
        running: string;
        gameOver: string;
    };
    ofcGameState: {
        idle: string;
        starting: string;
        running: string;
        gameOver: string;
    };
    playerState: {
        waiting: string;
        playing: string;
        outOfMoney: string;
        onBreak: string;
        disconnected: string;
        onleave: string;
        reserved: string;
        surrender: string;
    };
    tableSpeed: {
        hyperturbo: string;
        turbo: string;
        standard: string;
    };
    tableSpeedFromTurnTime: Record<string, number>;
    turnTimeFromSpeed: Record<number, string>;
    extraTimeBank: Record<string | number, number>;
    round: {
        holeCard: string;
        preflop: string;
        flop: string;
        turn: string;
        river: string;
        showdown: string;
    };
    roundToValue: Record<string, number>;
    ofcRound: {
        one: string;
        two: string;
        three: string;
        four: string;
        five: string;
        finished: string;
    };
    totalOFCround: number;
    OFCplayerCards: Record<string, number>;
    OFCplayerCardsInRound: Record<string, number>;
    nextOFCroundOf: Record<string, string>;
    ofcTableSpeed: {
        hyperturbo: string;
        turbo: string;
        standard: string;
    };
    ofcTableSpeedFromTurnTime: Record<string, number>;
    playerType: {
        dealer: string;
        smallBlind: string;
        bigBlind: string;
        straddle: string;
    };
    endingType: {
        gameComplete: string;
        everybodyPacked: string;
        onlyOnePlayerLeft: string;
    };
    dealerChatReason: Record<string, string>;
    ofcEndingType: {
        gameComplete: string;
        allPlayerFouled: string;
    };
    moves: string[];
    move: {
        check: string;
        call: string;
        bet: string;
        raise: string;
        allin: string;
        fold: string;
        standup: string;
        leave: string;
    };
    playerPrecheckValue: {
        CALL: string;
        CALL_ANY: string;
        FOLD: string;
        CHECK: string;
        ALLIN: string;
        CHECK_FOLD: string;
        CALL_ANY_CHECK: string;
        NONE: string;
    };
    OFCmove: {
        submit: string;
        discard: string;
        standup: string;
        leave: string;
    };
    delaerChatMove: Record<string, string>;
    moveValue: Record<string, number>;
    preCheck: {
        setOne: number;
        setTwo: number;
        setThree: number;
    };
    channelVariation: {
        holdem: string;
        omaha: string;
        omahahilo: string;
        ofc: string;
        FiveCardOmaha: string;
        SixCardOmaha: string;
        shortdeck: string;
        roe: string;
    };
    nextRoundOf: Record<string, string>;
    previousRoundOf: Record<string, string | null>;
    totalPlayerCards: Record<string, number>;
    totalCommunityCard: Record<string, number>;
    issueStatus: {
        open: string;
        close: string;
        process: string;
    };
    serverLogType: {
        info: string;
        warning: string;
        error: string;
        anonymous: string;
        request: string;
        response: string;
        broadcast: string;
        dbQuery: string;
    };
    serverType: {
        database: string;
        connector: string;
        gate: string;
        auth: string;
        shared: string;
    };
    logEvents: Record<string, string>;
    profile: {
        category: {
            profile: string;
            transaction: string;
            game: string;
            tournament: string;
            lobby: string;
            gamePlay: string;
        };
        subCategory: {
            login: string;
            signUp: string;
            update: string;
            emailVerify: string;
            password: string;
            otp: string;
            freeChips: string;
            withdraw: string;
            recharge: string;
            action: string;
            winner: string;
            participated: string;
        };
        activityStatus: {
            progress: string;
            completed: string;
            error: string;
        };
    };
    transaction: {
        subCategory: {
            transaction1: string;
            topUp: string;
        };
    };
    gamePlay: {
        subCategory: {
            startGame: string;
            leave: string;
            sit: string;
            move: string;
            info: string;
            gameOver: string;
        };
    };
    gameplay: {
        subCategory: {
            startGame: string;
            leave: string;
            sit: string;
            move: string;
            info: string;
            gameOver: string;
        };
    };
    game: {
        subCategory: Record<string, string>;
    };
    tournament: {
        subCategory: {
            register: string;
            deRegister: string;
        };
    };
    logType: {
        success: string;
        error: string;
        info: string;
        warning: string;
    };
    gameType: {
        normal: string;
        tournament: string;
    };
    tournamentState: {
        register: string;
        running: string;
        finished: string;
        upcoming: string;
        cancelled: string;
        started: string;
    };
    tournamentType: {
        sitNGo: string;
        normal: string;
        satelite: string;
        freeRoll: string;
    };
    role: {
        admin: string;
        affiliate: string;
        subaffiliate: string;
        user: string;
    };
    OFCevents: Record<string, string>;
    lobby: {
        subCategory: {
            fetchTables: string;
            register: string;
        };
    };
    videoLogEventType: {
        broadcast: string;
        response: string;
        gamePlayers: string;
        joinResponse: string;
    };
    country: Array<{ name: string }>;
    MantisApi: string;
    SendGridApiKey: string;
    mailMessages: {
        from_email: string;
        mail_subjectAffiliate: string;
        mail_contentAffiliate: string;
        mail_subjectAffiliateEdit: string;
        mail_contentAffiliateEdit: string;
        mail_subjectForgotPassword: string;
        mail_contentForgotPassword: string;
        mail_subjectForgotPasswordDashboard: string;
        mail_contentForgotPasswordDashboard: string;
        mail_subjectEmailVerification: string;
        mail_contentEmailVerification: string;
        mail_subjectDownloadApp: string;
        mail_contentDownloadApp: string;
        mail_subjectScratchCardAffiliate: string;
        mail_subjectScratchCardPlayer: string;
        mail_scratchCardSender: string;
        mail_subjectScratchcard: string;
        from_emailAdmin: string;
        to_emailAdmin: string;
        mail_subjectAdmin: string;
        mail_contentAdmin: string;
        from_emailUserSupport: string;
        mail_subjectAffiliateUserSupportSubject: string;
        mail_contentAffiliateUserSupportContent: string;
        from_emailLogin: string;
        subjectLogin: string;
        contentLogin: string;
    };
    phoneMessages: {
        isSmsAllowedForScratch: boolean;
        sms_contentDownloadApp: string;
    };
    recordChange: Record<string, string>;
    broadcasts: Record<string, string>;
    linkForAppDownload: string;
    blindPayRequired: boolean;
    autoStraddleVisible: boolean;
    disconnectedMoveSitout: number;
    contestSegment: {
        bronze: [number, number];
        silver: [number, number];
        gold: [number, number];
    };
    gameActivity: {
        category: {
            game: string;
            tournament: string;
            gamePlay: string;
        };
    };
}

const stateOfX: StateOfX = {
    gameDetails: {
        name: systemConfig.originalName
    },
    OFCstartGameEvent: {
        sit: "PLAYERSIT",
        gameOver: "GAMEOVER",
        addPoints: "ADDPINTS"
    },
    startGameEvent: {
        sit: "PLAYERSIT",
        gameOver: "GAMEOVER",
        resume: "RESUME",
        addChips: "ADDCHIPS",
        tournament: "TOURNAMENT",
        tournamentAfterBreak: "TOURNAMENTAFTERBREAK",
        handAfterBreak: 'HANDAFTERBREAK'
    },
    startGameEventOnChannel: {
        idle: "IDLE",
        starting: "STARTING",
        running: "RUNNING"
    },
    gameState: {
        idle: "IDLE",
        starting: "STARTING",
        running: "RUNNING",
        gameOver: "GAMEOVER"
    },
    ofcGameState: {
        idle: "IDLE",
        starting: "STARTING",
        running: "RUNNING",
        gameOver: "GAMEOVER"
    },
    playerState: {
        waiting: "WAITING",
        playing: "PLAYING",
        outOfMoney: "OUTOFMONEY",
        onBreak: "ONBREAK",
        disconnected: "DISCONNECTED",
        onleave: "ONLEAVE",
        reserved: "RESERVED",
        surrender: "SURRENDER"
    },
    tableSpeed: {
        hyperturbo: "HYPERTURBO",
        turbo: "TURBO",
        standard: "STANDARD"
    },
    tableSpeedFromTurnTime: {
        "HYPERTURBO": 10,
        "TURBO": 20,
        "STANDARD": 30
    },
    turnTimeFromSpeed: {
        10: "HYPERTURBO",
        20: "TURBO",
        30: "STANDARD"
    },
    extraTimeBank: {
        10: 20,
        20: 20,
        30: 20,
        'default': 20
    },
    round: {
        holeCard: "HOLE CARDS",
        preflop: "PREFLOP",
        flop: "FLOP",
        turn: "TURN",
        river: "RIVER",
        showdown: "SHOWDOWN"
    },
    roundToValue: {
        "HOLE CARDS": 0,
        "PREFLOP": 1,
        "FLOP": 2,
        "TURN": 3,
        "RIVER": 4,
        "SHOWDOWN": 5
    },
    ofcRound: {
        one: "ONE",
        two: "TWO",
        three: "THREE",
        four: "FOUR",
        five: "FIVE",
        finished: "FINISHED"
    },
    totalOFCround: 5,
    OFCplayerCards: {
        "ONE": 5,
        "TWO": 3,
        "THREE": 3,
        "FOUR": 3,
        "FIVE": 3
    },
    OFCplayerCardsInRound: {
        "ONE": 5,
        "TWO": 7,
        "THREE": 9,
        "FOUR": 11,
        "FIVE": 13
    },
    nextOFCroundOf: {
        "ONE": "TWO",
        "TWO": "THREE",
        "THREE": "FOUR",
        "FOUR": "FIVE",
        "FIVE": "FINISHED"
    },
    ofcTableSpeed: {
        hyperturbo: "HYPERTURBO",
        turbo: "TURBO",
        standard: "STANDARD"
    },
    ofcTableSpeedFromTurnTime: {
        "HYPERTURBO": 10,
        "TURBO": 20,
        "STANDARD": 30
    },
    playerType: {
        dealer: "DEALER",
        smallBlind: "SMALLBLIND",
        bigBlind: "BIGBLIND",
        straddle: "STRADDLE"
    },
    endingType: {
        gameComplete: "GAMECOMPLETED",
        everybodyPacked: "EVERYBODYPACKED",
        onlyOnePlayerLeft: "ONLYONEPLAYERLEFT"
    },
    dealerChatReason: {
        "GAMECOMPLETED": "GAMECOMPLETED",
        "EVERYBODYPACKED": "Every Body Else Folded",
        "ONLYONEPLAYERLEFT": "Every One Else Left"
    },
    ofcEndingType: {
        gameComplete: "GAMECOMPLETED",
        allPlayerFouled: "ALLPLAYERFOULED"
    },
    moves: ["CHECK", "CALL", "BET", "RAISE", "ALLIN", "FOLD"],
    move: {
        check: "CHECK",
        call: "CALL",
        bet: "BET",
        raise: "RAISE",
        allin: "ALLIN",
        fold: "FOLD",
        standup: "STANDUP",
        leave: "LEAVE"
    },
    playerPrecheckValue: {
        CALL: 'Call',
        CALL_ANY: 'CallAny',
        FOLD: 'Fold',
        CHECK: 'Check',
        ALLIN: 'AllIn',
        CHECK_FOLD: 'Check_Fold',
        CALL_ANY_CHECK: 'CallAny_Check',
        NONE: 'NONE'
    },
    OFCmove: {
        submit: "SUBMIT",
        discard: "DISCARD",
        standup: "STANDUP",
        leave: "LEAVE"
    },
    delaerChatMove: {
        "CHECK": "Checks",
        "CALL": "Calls",
        "BET": "Bets",
        "RAISE": "Raises",
        "ALLIN": "All In",
        "FOLD": "Folds"
    },
    moveValue: {
        "check": 1,
        "call": 2,
        "bet": 3,
        "raise": 4,
        "allin": 5,
        "fold": 6
    },
    preCheck: {
        setOne: 1,
        setTwo: 2,
        setThree: 3
    },
    channelVariation: {
        holdem: "Texas Hold'em",
        omaha: "Omaha",
        omahahilo: "Omaha Hi-Lo",
        ofc: "Open Face Chinese Poker",
        FiveCardOmaha: "Five Card Omaha",
        SixCardOmaha: "Six Card Omaha",
        shortdeck: "Six Plus Texas Hold'em",
        roe: "ROE"
    },
    nextRoundOf: {
        "PREFLOP": "FLOP",
        "FLOP": "TURN",
        "TURN": "RIVER",
        "RIVER": "SHOWDOWN"
    },
    previousRoundOf: {
        "PREFLOP": null,
        "FLOP": "PREFLOP",
        "TURN": "FLOP",
        "RIVER": "TURN",
        "SHOWDOWN": "RIVER"
    },
    totalPlayerCards: {
        "Texas Hold'em": 2,
        "Six Plus Texas Hold'em": 2,
        "Omaha": 4,
        "Omaha Hi-Lo": 4,
        "Five Card Omaha": 5,
        "Six Card Omaha": 6
    },
    totalCommunityCard: {
        "PREFLOP": 0,
        "FLOP": 3,
        "TURN": 4,
        "RIVER": 5,
        "SHOWDOWN": 5
    },
    issueStatus: {
        open: "OPEN",
        close: "CLOSE",
        process: "PROCESS"
    },
    serverLogType: {
        info: "INFO",
        warning: "WARNING",
        error: "ERROR",
        anonymous: "ANONYMOUS",
        request: "REQUEST",
        response: "RESPONSE",
        broadcast: "BROADCAST",
        dbQuery: "DBQUERY"
    },
    serverType: {
        database: "DATABASE",
        connector: "CONNECTOR",
        gate: "GATE",
        auth: "AUTH",
        shared: "SHARED"
    },
    logEvents: {
        joinChannel: "JOINCHANNEL",
        reserved: "RESERVED",
        sit: "SIT",
        tableInfo: "TABLEINFO",
        startGame: "STARTGAME",
        playerTurn: "PLAYERTURN",
        leave: "LEAVE",
        roundOver: "ROUNDOVER",
        gameOver: "GAMEOVER",
        summary: "SUMMARY",
        playerRoyality: "OFCROYALITY",
        evChop: "EVCHOP",
        evRIT: "EVRIT"
    },
    profile: {
        category: {
            profile: "PROFILE",
            transaction: "TRANSACTION",
            game: "GAME",
            tournament: "TOURNAMENT",
            lobby: "LOBBY",
            gamePlay: "GAMEPLAY"
        },
        subCategory: {
            login: "LOGIN",
            signUp: "SIGNUP",
            update: "UPDATE",
            emailVerify: "EMAILVERIFY",
            password: "PASSWORD",
            otp: "OTP",
            freeChips: "FREECHIPS",
            withdraw: "WITHDRAW",
            recharge: "RECHARGE",
            action: "ACTION",
            winner: "WINNER",
            participated: "PARTICIPATED"
        },
        activityStatus: {
            progress: "PROGRESS",
            completed: "COMPLETED",
            error: "ERROR"
        }
    },
    transaction: {
        subCategory: {
            transaction1: "TRANSACTION1",
            topUp: "FUND TRANSFER (VIP Credit)"
        }
    },
    gamePlay: {
        subCategory: {
            startGame: "START GAME",
            leave: "PLAYER LEFT",
            sit: "PLAYER SIT",
            move: "PLAYER MOVE",
            info: "INFO",
            gameOver: "GAME OVER"
        }
    },
    gameplay: {
        subCategory: {
            startGame: "START GAME",
            leave: "PLAYER LEFT",
            sit: "PLAYER SIT",
            move: "PLAYER MOVE",
            info: "INFO",
            gameOver: "GAME OVER"
        }
    },
    game: {
        subCategory: {
            startGame: "START GAME",
            join: "JOIN",
            sit: "SIT",
            leave: "LEAVE",
            move: "MOVE",
            info: "INFO",
            blindsAndStraddle: "BLINDS AND STRADDLE",
            winner: "WINNER",
            playerCards: "PLAYER CARDS",
            playerState: "PLAYER STATUS",
            playerChat: "PLAYER CHAT",
            rakeDeduct: "RAKE DEDUCT",
            runItTwice: "RUN IT TWICE",
            sitoutNextHand: "SIT OUT NEXT HAND",
            sitoutNextBigBlind: "SIT OUT NEXT BIG BLIND",
            resetSitOut: "RESET SIT OUT",
            resume: "RESUME",
            addChips: "ADD CHIPS",
            updateTableSettings: "UPDATE TABLE SETTINGS(MUCK HAND)"
        }
    },
    tournament: {
        subCategory: {
            register: "REGISTER",
            deRegister: "DE-REGISTER"
        }
    },
    logType: {
        success: "SUCCESS",
        error: "ERROR",
        info: "INFO",
        warning: "WARNING"
    },
    gameType: {
        normal: "NORMAL",
        tournament: "TOURNAMENT"
    },
    tournamentState: {
        register: "REGISTER",
        running: "RUNNING",
        finished: "FINISHED",
        upcoming: "UPCOMING",
        cancelled: "CANCELLED",
        started: "STARTED"
    },
    tournamentType: {
        sitNGo: "SITNGO",
        normal: "NORMAL",
        satelite: "SATELLITE",
        freeRoll: "FREEROLL"
    },
    role: {
        admin: "admin",
        affiliate: "affiliate",
        subaffiliate: "sub-affiliate",
        user: "user"
    },
    OFCevents: {
        makeMoveSuccess: "MAKEMOVESUCCESS",
        makeMoveSuccessFail: "MAKEMOVEFAIL",
        leaveSuccess: "LEAVESUCCESS",
        autositSuccess: "AUTOSITSUCCESS",
        addpointSuccess: "ADDPOINTSUCCESS",
        sitSuccess: "SITSUCCESS"
    },
    lobby: {
        subCategory: {
            fetchTables: "FETCH TABLES",
            register: "TOURNAMENT REGISTERATION"
        }
    },
    videoLogEventType: {
        broadcast: "broadcast",
        response: "response",
        gamePlayers: "gamePlayers",
        joinResponse: "joinResponse"
    },
    country: [
        { name: 'India' },
        { name: 'Nepal' },
        { name: 'Bangladesh' }
    ],
    
    mailMessages: {
        from_email: systemConfig.from_email,
        mail_subjectAffiliate: "your affiliate request is processed",
        mail_contentAffiliate: "Hello,Your request has been proceed. Admin will contact ASAP",
        mail_subjectAffiliateEdit: "Affiliate profile update",
        mail_contentAffiliateEdit: "Affiliate your profile has been updated",
        mail_subjectForgotPassword: "Forgot Password Link",
        mail_contentForgotPassword: "Click on given link to find your password",
        mail_subjectForgotPasswordDashboard: "Resetting dashboard password",
        mail_contentForgotPasswordDashboard: "Click on given link to find your password",
        mail_subjectEmailVerification: "Email Verification Link",
        mail_contentEmailVerification: "Click on the given link to verify your email ",
        mail_subjectDownloadApp: `Download ${systemConfig.userNameForMail} App`,
        mail_contentDownloadApp: `Hi, you are just one click away from playing poker anytime and anywhere on ${systemConfig.domain}. Download our app now. `,
        mail_subjectScratchCardAffiliate: `Scratch card (affiliate) of ${systemConfig.userNameForMail}.com`,
        mail_subjectScratchCardPlayer: `Scratch card for ${systemConfig.userNameForMail}.com`,
        mail_scratchCardSender: systemConfig.cashierMail,
        mail_subjectScratchcard: "Create ScratchCard Link",
        from_emailAdmin: systemConfig.from_email,
        to_emailAdmin: systemConfig.from_email,
        mail_subjectAdmin: "Affiliate Registration",
        mail_contentAdmin: "An affiliate has been registered under you",
        from_emailUserSupport: systemConfig.from_email,
        mail_subjectAffiliateUserSupportSubject: "User Support Desk",
        mail_contentAffiliateUserSupportContent: "User Support Desk Content",
        from_emailLogin: systemConfig.from_email,
        subjectLogin: "User Login",
        contentLogin: "User Successfully logged in"
    },
    phoneMessages: {
        isSmsAllowedForScratch: false,
        sms_contentDownloadApp: `Hi, you are just one click away from playing poker anytime and anywhere on ${systemConfig.domain}. Download our app now. `
    },
    recordChange: {
        tourListChange: "tourListChange",
        tourListUpdate: "tourListUpdate",
        tourDetailsUpdate: "tourDetailsUpdate",
        player: "PLAYER",
        table: "TABLE",
        tableNewValues: "TABLENEWVALUES",
        tableViewNewPlayer: "TABLEVIEWNEWPLAYER",
        tableViewLeftPlayer: "TABLEVIEWLEFTPLAYER",
        tablePlayingPlayer: "TABLEPLAYINGPLAYER",
        tableAvgPot: "TABLEAVGPOT",
        tableFlopPercent: "TABLEFLOPPERCENT",
        tableWaitingPlayer: "TABLEWAITINGPLAYER",
        tableViewNewWaitingPlayer: "TABLEVIEWNEWWAITINGPLAYER",
        tableViewChipsUpdate: "TABLEVIEWCHIPSUPDATE",
        playerJoinTable: "PLAYERJOINTABLE",
        playerLeaveTable: "PLAYERLEAVETABLE",
        onlinePlayers: "ONLINEPLAYERS",
        tournamentEnrolledPlayers: "TOURNAMENTTABLEENROLLED",
        tournamentStateChanged: "TOURNAMENTSTATECHANGED",
        tournamentRankUpdate: "TOURNAMENTRANKUPDATE",
        destroyTable: "DESTROYTABLE",
        shufflePlayers: "SHUFFLEPLAYERS",
        loyalityUpdate: "LOYALITYUPDATE",
        tableViewLeftWaitingPlayer: "TABLEVIEWLEFTWAITINGPLAYER",
        tournamentBlindChange: "TOURNAMENTBLINDCHANGE",
        prizePool: "PRIZEPOOL",
        tournamentActivePlayers: "TOURNAMENTACTIVEPLAYERS",
        tournamentCancelled: "TOURNAMENTCANCELLED",
        bountyChanged: "BOUNTYCHANGED"
    },
    broadcasts: {
        tableUpdate: "tableUpdate",
        updateProfile: "updateProfile",
        tournamentTableUpdate: "tableUpdate",
        playerUpdate: "playerUpdate",
        updatePlayer: "updatePlayer",
        tableView: "tableView",
        joinTableList: "joinTableList",
        onlinePlayers: "onlinePlayers",
        tournamentStateChange: "tableUpdate",
        tournamentRankUpdate: "tableView",
        tournamentLobby: "tournamentLobby",
        tournamentCancelled: "tournamentCancelled",
        antiBankingUpdatedData: "antiBankingUpdatedData"
    },
    linkForAppDownload: `https://tinyurl.com/${systemConfig.sendSmsUsername}`,
    blindPayRequired: true,
    autoStraddleVisible: true,
    disconnectedMoveSitout: 2,
    contestSegment: {
        bronze: [0, 30],
        silver: [31, 100],
        gold: [101, 10000]
    },
    gameActivity: {
        category: {
            game: "GAME",
            tournament: "TOURNAMENT",
            gamePlay: "GAMEPLAY"
        }
    }
};

export default stateOfX;