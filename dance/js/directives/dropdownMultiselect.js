'use strict';
//sdddddddd

directivesModule.directive('dropdownMultiselect', function(){
   return {
       restrict: 'E',
       scope:{         
            sourceItems: '='
       },
       template: "<div class='btn-group' data-ng-class='{open: open}'>"+
        "<button type='button' class='btn btn-small'>{{caption}}</button>"+
                "<button type='button' class='btn btn-small dropdown-toggle' data-ng-click='open=!open;openDropdown()'><span class='caret'></span></button>"+
                "<ul class='dropdown-menu' aria-labelledby='dropdownMenu' style='height: 200px; overflow-y: auto;'>" + 
                    "<li style='display: inline-flex;'><a data-ng-click='selectAll()'><i class='fa fa-check'></i> Выбрать все</a>"+
                        "<a data-ng-click='deselectAll();'><i class='fa fa-times'></i> Отмена</a>" +
                   "</li>" +
                    "<li class='divider'></li>" +
                    '<li data-ng-repeat="option in sourceItems"> <a data-ng-click="setSelectedItem()">{{option.name}}<span data-ng-class="isChecked(option)"></span></a></li>' +                                        
                "</ul>" +
            "</div>" ,
       controller: function($scope){
           $scope.caption = '---';
           
            $scope.selectAll = function () {
                 for(var i=0; i < $scope.sourceItems.length; i++)
                    $scope.sourceItems[i].selected = true;
                    
                $scope.updateCaption();
            };  
                      
            $scope.deselectAll = function() {
                for(var i=0; i < $scope.sourceItems.length; i++)
                    $scope.sourceItems[i].selected = false;
                    
                $scope.updateCaption();
            };
            
            $scope.setSelectedItem = function(){
                this.option.selected = !this.option.selected;
                $scope.updateCaption();
                return true;
            };

            $scope.updateCaption = function(){
                var first = null;
                var totalSelectedCount = 0;
                
                if (!$scope.sourceItems)
                    return 
                    
                for(var i=$scope.sourceItems.length-1; i >= 0; i--)
                    if ($scope.sourceItems[i].selected == true){
                        first = $scope.sourceItems[i];
                        totalSelectedCount++;
                    }
                
                if (!first){
                    $scope.caption = '---';    
                }
                else if (totalSelectedCount == 1){
                    $scope.caption = first.name;
                }
                else if (totalSelectedCount > 1){
                    $scope.caption = first.name + ', + (' + (totalSelectedCount - 1) + ')';
                }       
            };
            
            $scope.isChecked = function (option) {                 
                if (option.selected) {
                    return 'fa fa-check pull-right';
                }
                return false;
            };
            
            $scope.$watch('sourceItems', function(){
                $scope.updateCaption();
            }, true);
                    
       }
   } 
});