define(['angularAMD'], function(ng) {
    'use strict';

    var config = angular.module('config', [])
        .constant('ENV', {
          baseURL: "http://localhost:",
          adSalPort: "8181",
          mdSalPort : "8181",
          ofmPort : "8181",
          configEnv : "ENV_PROD",
          odlUserName: 'admin',
          odlUserPassword: 'admin',
          getBaseURL : function(salType){
              if(salType!==undefined){
                  var urlPrefix = "";
                  if(this.configEnv==="ENV_DEV"){
                      urlPrefix = this.baseURL;
                  }else{
                      urlPrefix = window.location.protocol+"//"+window.location.hostname+":";
                  }

                  if(salType==="AD_SAL"){
                      return urlPrefix + this.adSalPort;
                  }else if(salType==="MD_SAL"){
                      return  urlPrefix + this.mdSalPort;
                  }else if(salType==="CONTROLLER"){
                      return  urlPrefix + this.ofmPort;
                  }
              }

              return "";


               }
            });

    return config;
});