const axios = require("axios");
const xsenv = require("@sap/xsenv");
const SapCfAxios = "";


async function makeServiceCall(requestObject) {
    // requestObject = {
    //     method:"",
    //     url:"",
    //     headers:{
    //         Authorization: " ",
    //         'Content-Type': "",
    //         'Proxy-Authorization': " "
    //     },
    //     proxy:{host:"",port:""},
    //     data:{},
    //     params: {
    //     ID: 12345
    //   }
    // }
    try {
        let callresponse = await axios.request(requestObject);
        return callresponse;
    } catch (error) {
        let errorThrow;
        if (error.response) {
            if (error.response.data) {
                errorThrow = error.response.data;
            } else {
                errorThrow = error.response;
            }
        } else if (error.request) {
            errorThrow = JSON.stringify(error.request);
        } else if (error.message) {
            errorThrow = error.message;
        } else {
            errorThrow = JSON.stringify(error);
        }
        throw errorThrow;
    }
};

let getConnectivity = async (connServiceInstance) => {
    if (connServiceInstance) {
        try {
            let conn = await getConnectivity_ins(connServiceInstance);
            console.log("connectivity",conn);
            return conn;
        } catch (error) {
            console.log("connectivityError",error);
            // console.log(error);
            throw "Error when fetching Destination " + error;
        }
    } else {
        throw "Please Send Connectivity Service Name in the account";
    }
}

let getDestination = async (destServiceInstance, destName) => {
    if (destServiceInstance && destName) {
        try {
            let dest = await getDestination_ins(destServiceInstance, destName);
            return dest;
        } catch (error) {
            throw error
            // req.error({ "status": 500, "message": "Error when fetching Destination " });
        }
    }
    // } else {
    //     // req.error({ "status": 500, "message": "Please Send Destination Service Name in the account and Destination Name" });
    // }
};

async function getDestination_ins(destinationServiceInstanceName, destinationName) {
    
    xsenv.loadEnv('../../default-env.json');
    const oDestinationService = xsenv.getServices({ destination: { name: destinationServiceInstanceName } });

    let sAccessToken = await getJWTToken(oDestinationService.destination, "/oauth/token?grant_type=client_credentials");
    let oDestination = await getDestinationInfo(oDestinationService.destination.uri, sAccessToken, destinationName);
    // console.log("oDestinaton" , oDestination);
    return oDestination;
}

async function getJWTToken(oInstance, oAuthTokenUrlSuffix) {
    const sUAAUrl = oInstance.url + oAuthTokenUrlSuffix;
    const sUAACredentials = "Basic " + Buffer.from(oInstance.clientid + ":" + oInstance.clientsecret).toString('base64');
    try {
        let oAuthResp = await axios.request({
            url: sUAAUrl,
            method: 'POST',
            headers: {
                'Authorization': sUAACredentials
            }
        });
        return oAuthResp.data.access_token;

    } catch (e) {
        //Error while Fetching JWT Token 
        throw "Noob Error - Error while Fetching JWT Token ! "
    }
}

async function getDestinationInfo(sDestinationUrl, sAccessToken, sDestinationName) {
    try {
        let oResponse = await axios.request({
            url: sDestinationUrl + "/destination-configuration/v1/destinations/" + sDestinationName,
            method: "GET",
            headers: {
                'Authorization': "Bearer " + sAccessToken
            }
        });

        return oResponse.data.destinationConfiguration;
    } catch (e) {
        throw "Intermediate Error - Cannot fetch Destination Information with Destination Name : " + sDestinationName
    }
}

async function makeBasicCred(userName, password) {
    return "Basic " + Buffer.from(`${userName}:${password}`).toString('base64');
}

async function makeAxiosCall(requestObject, resolveAtError) {
    return new Promise(async (resolve, reject) => {
        try {
            let callresponse = await axios.request(requestObject);
            resolve(callresponse);
        } catch (error) {
            let errorThrow;
            if (error.response) {
                if (error.response.data) {
                    errorThrow = error.response.data;
                } else {
                    errorThrow = error.response;
                }
            } else if (error.request) {
                errorThrow = error.request;
            } else if (error.message) {
                errorThrow = error.message;
            } else {
                errorThrow = error;

            }
            if (resolveAtError) {
                resolve(errorThrow);
            } else {
                reject(errorThrow);
            }
        }
    });
};

async function makeBearerCred(token) {
    return "Bearer " + token;
}
async function fetchBearerToken(tokenurl, userName, password) {
    let tokenReqObj = {
        url: tokenurl,
        method: 'POST',
        headers: {
            'Authorization': await makeBasicCred(userName, password)
        }
    }
    try {
        let tokenResponse = await axios.request(tokenReqObj);
        return tokenResponse.data.access_token;
    } catch (error) {
        throw error;
    }
}

async function getXSRFTokenNCookie(requestObject, destinationName) {
    let cfaxios = SapCfAxios(destinationName);
    const xcsrftoken = 'x-csrf-token';
    const setcookie = 'set-cookie';

    try {
        requestObject.headers[xcsrftoken] = "fetch";
        let callresponse = await cfaxios(requestObject);
        if (callresponse.headers[xcsrftoken] && callresponse.headers[setcookie]) {
            return {
                token: callresponse.headers[xcsrftoken],
                cookie: callresponse.headers[setcookie]
            }
        } else {
            return {};
        }
    } catch (error) {
        // console.log(error);
        throw error;
    }
};

async function makeAxiosServiceCall(requestObject, destinationName) {
    let axios = SapCfAxios(destinationName);
    try {
        let callresponse = await axios(requestObject);
        return callresponse;
    } catch (error) {
        throw error;
    }
};
async function getConnectivity_ins(connectivityServiceInstanceName) {
    xsenv.loadEnv('/home/user/projects/salesorderauto/default-env.json');

    const oConnectivityService = xsenv.getServices({ connectivity: { name: connectivityServiceInstanceName } });
    let sAccessToken = await getJWTToken(oConnectivityService.connectivity, "/oauth/token?grant_type=client_credentials");
    return {
        httpHeader: { 'Proxy-Authorization': 'Bearer ' + sAccessToken },
        jwtToken: sAccessToken,
        onpremise_proxy_host: oConnectivityService.connectivity.onpremise_proxy_host,
        onpremise_proxy_port: oConnectivityService.connectivity.onpremise_proxy_port
    };
}
module.exports = {

    makeServiceCall: makeServiceCall,
    makeBasicCred: makeBasicCred,
    makeBearerCred: makeBearerCred,
    fetchBearerToken: fetchBearerToken,
    getXSRFTokenNCookie: getXSRFTokenNCookie,
    makeAxiosServiceCall: makeAxiosServiceCall,
    makeAxiosCall: makeAxiosCall,
    getConnectivity: getConnectivity,
    getDestination: getDestination,
}