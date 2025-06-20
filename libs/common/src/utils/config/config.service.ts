
export const configData:any = {};

configData.JWTPrivateKey = "f95Zh7QZ939o6lmp73xM88kXI2T9yJ6g5";

configData.removeAllLogs = false;
configData.toggleIpAddressRecord = false;
configData.setDefaultSizeForIpRecord = 5 * 1000000;
configData.scratchCardExpireMailOffset = 2;
configData.defaultVersion = {
    appName : "MegaPoker",
    versionNo : 1,
    platform : "Android",
    releaseDate : new Date(),
    updateRequired : false
}

configData.mandrillKeys = {
	"mandrillKey"           : "VguVNo7_tDYajcG6xtyEEg",
	"host"									: "dev3dashboard.pokermagnet.com",
	"port"									: "3009",
}

configData.freeChips = {
    noOfChips : 50000,
    limit : 100000
}

configData.smsApiKeys = {
	apiKey : "A14c50861250021c4ec2e587fa81edbf2",
	apiUrl : "http://trans.kapsystem.com/api/v3/index.php",
	sender : "KAPMSG",
	message : "Your otp for verification is "
}

configData.defaultAdmin = [
{
    "name": "MasterAffiliate",
    "email": "affiliate@pokermagnet.com",
    "userName": "Affiliate2",
    "gender": "Male",
    "dob": 3456345,
    "mobile": 8459824888,
    "address": "SMC....",
    "pincode": 713324,
    "city": "New Delhi",
    "state": "Delhi",
    "country": "India",
    "status": "Active",
    "roles" : "affiliate",
    "role": { "name" : "affiliate", "level" : 0 },
    "rakeCommision" : 0,
    "realChips" : 0,
    "profit" : 0,
    "withdrawal" : 0,
    "deposit" : 0,
    "chipsManagement" : {
        "deposit" : 0,
        "withdrawl" : 0,
        "withdrawlCount" : 0,
        "profitCount" : 0
    }
},
{
    "name": "SuperAdmin",
    "email": "admin@pokermagnet.com",
    "userName": "MagnetAdmin",
    "gender": "Male",
    "dob": 3456345,
    "mobile": 8459824885,
    "address": "SMC....",
    "pincode": 713324,
    "city": "New Delhi",
    "state": "Delhi",
    "country": "India",
    "status": "Active",
    "roles" : "admin",
    "role": {'name' : "admin", 'level' : 7}
}]
configData.defaultAdminForSchedular = { name: 'SuperAdmin',
                                        userName: 'MagnetAdmin',
                                        role: '{"name":"admin","level":7}',
                                        id: 'admin@pokermagnet.com' }


configData.rootTools = {};
  configData.rootTools.connectorHost              = "staging.gamebadlo.com";
  configData.rootTools.connectorPort              = "3050";
  configData.rootTools.gateHost                   = "staging.gamebadlo.com";
  configData.rootTools.gatePort                   = "3014";
  configData.rootTools.event                      = {};
  configData.rootTools.broadcast                  = {};
  configData.rootTools.event.tournamentRoomChange = "TOURNAMENTROOMCHANGE";
  configData.rootTools.event.cashGameTableChange  = "CASHGAMETABLECHANGE";
  configData.rootTools.broadcast.tableUpdate      = "tableUpdate";
  configData.rootTools.broadcast.addTable         = "addTable";
  configData.rootTools.broadcast.removeTable      = "removeTable";

module.exports = configData;
