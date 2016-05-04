'use strict';
//ddвddddв

/*===========================================================================================
Utils
===========================================================================================*/

servicesModule.factory('UtilsSrvc', function($dialog, $filter) {
    
    return {
        openMessageBox: function(title, msg, func){
            var btns = [{result: true, label: 'Ок', cssClass: 'btn-primary btn-small'}, 
                        {result: false, label: $filter('localize')('Отмена'), cssClass: 'btn-small'}];
            
            $dialog.messageBox($filter('localize')(title), $filter('localize')(msg), btns).open().then(function(result){
                if (result && func)
                    func(); 
             });
        },
        openCustomMessageBox: function(title, msg, btns){
            $dialog.messageBox($filter('localize')(title), $filter('localize')(msg), btns).open().then(function(result){
                for (var i=0; i < btns.length; i++){
                    if (result == btns[i].result && btns[i].func)
                        btns[i].func();
                }
             });
        },
        getAlert: function(title, msg, eventType, visible){     
            if (msg && eventType == 'error'){
                msg = msg.replace(/#5001/g, '');
            }

            return {title: $filter('localize')(title),
                    msg: $filter('localize')(msg),
                    cssClass: 'alert alert-' + eventType,
                    visible: visible};
        },
        getIndexes: function(array, objField, valueField){
            var indexes = [];
            
            if (!array) return indexes;
            
            for (var i = 0; i < array.length; i++) {
                if (array[i][objField] == valueField)
                    indexes.push(i);
            };
            return indexes;
        },
        getValidDate: function(value){
			var validDate = '';
			
			if (value instanceof Date){
				validDate = $filter('date')(value, 'y-MM-dd')
			}
			else if (isNaN(new Date(value)) == false && value.length <= 10){
				validDate = value;
			}
			
			console.log(value, validDate);
			return validDate;
        },
        getPropertyValue: function (item, propertyStr, defaultValue){
            var value;
            defaultValue = defaultValue ? defaultValue : '';

            try{
                var properties = propertyStr.split('.');
                
                switch(properties.length){
                    case 1:
                        value = item[properties[0]];
                        break;
                    case 2:
                        value = item[properties[0]][properties[1]];
                        break;
                    case 3:
                        value = item[properties[0]][properties[1]][properties[2]];
                        break;
                    case 4:
                        value = item[properties[0]][properties[1]][properties[2]][properties[3]];
                        break;
                    case 5:
                        value = item[properties[0]][properties[1]][properties[2]][properties[3]][properties[4]];
                        break;
                }
            }
            catch(ex){
                //console.log('Cвойства не существует ' + propertyStr);
            }

            return value == undefined ? defaultValue : value;
        },
        base64Encode: function(s) {
            return btoa(unescape(encodeURIComponent(s)));
        },
        base64Decode: function(s) {
            return decodeURIComponent(escape(atob(s)));
        },
        getCurrencySignByISOCode: function(code){
            switch(code){
                case 'EUR': return '€';
                case 'USD': return '$';
                case 'GBR': return '£'; 
                case 'RUB': return $filter('localize')('руб.');
                default: return '???'; 
            }
        }
    }
});
  
