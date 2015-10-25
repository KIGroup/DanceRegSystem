'use strict';
//sdddddddd

directivesModule.directive('dropdownMultiselect', function(){
   return {
       restrict: 'E',
       scope:{         
            model: '=',
            pre_selected: '=preSelected',
            options: '='
       },
       template: "<div class='btn-group' data-ng-class='{open: open}'>"+
        "<button type='button' class='btn btn-small'>{{caption}}</button>"+
                "<button type='button' class='btn btn-small dropdown-toggle' data-ng-click='open=!open;openDropdown()'><span class='caret'></span></button>"+
                "<ul class='dropdown-menu' aria-labelledby='dropdownMenu' style='height: 200px; overflow-y: auto;'>" + 
                    "<li><a data-ng-click='selectAll()'><i class='fa fa-check'></i>  Check All</a></li>" +
                    "<li><a data-ng-click='deselectAll();'><i class='fa fa-times'></i>  Uncheck All</a></li>" +                    
                    "<li class='divider'></li>" +
                    "<li data-ng-repeat='option in options'> <a data-ng-click='setSelectedItem()'>{{option.name}}<span data-ng-class='isChecked(option.id)'></span></a></li>" +                                        
                "</ul>" +
            "</div>" ,
       controller: function($scope){
           $scope.caption = '---';
           $scope.openDropdown = function(){        
                if ($scope.pre_selected){
                    for(var i=0; i<$scope.pre_selected.length; i++){                        
                        //$scope.model.push($scope.pre_selected[i].id);
                        //$scope.selected_items.push($scope.pre_selected[i].id);
                    }            
                }
                $scope.updateCaption();                            
            };
           
            $scope.selectAll = function () {
                $scope.model = _.pluck($scope.options, 'id');
                $scope.updateCaption();
            };  
                      
            $scope.deselectAll = function() {
                $scope.model=[];
                $scope.updateCaption();
            };
            
            $scope.setSelectedItem = function(){
                var id = this.option.id;
                
                if (_.contains($scope.model, id)) {
                    $scope.model = _.without($scope.model, id);
                } else {
                    $scope.model.push(id);
                }
                
                $scope.updateCaption();
                return false;
            };

            $scope.isChecked = function (id) {                 
                if (_.contains($scope.model, id)) {
                    return 'fa fa-check pull-right';
                }
                return false;
            };     
            
            $scope.updateCaption = function(){
                if (!$scope.model || $scope.model.length == 0){
                    $scope.caption = '---';    
                }
                else if ($scope.model.length == 1){
                    $scope.caption = $scope.getOptionNameById($scope.model[0]);
                }
                else if ($scope.model.length > 1){
                    $scope.caption = $scope.getOptionNameById($scope.model[0]) + ', + (' + ($scope.model.length - 1) + ')';
                }       
            };
            
            $scope.getOptionNameById = function(id){
                if ($scope.options){
                    for(var i=0; i < $scope.options.length; i++){
                        if ($scope.options[i].id == id)
                            return $scope.options[i].name;
                    }
                }
                
                return '---';
            };      
            
            
            $scope.$watch('options', function(){
                $scope.updateCaption();
            }, true);
            
            $scope.$watch('pre_selected', function(){
                if ($scope.pre_selected && $scope.model && $scope.model.length == 0){
                    for(var i=0; i<$scope.pre_selected.length; i++){                        
                        $scope.model.push($scope.pre_selected[i].id);
                    }            
                }
            }, true);            
       }
   } 
});