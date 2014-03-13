var modulename = module.exports = 'digger.admin.settingsfolders';

angular
  .module(modulename, [
    
  ])

  .factory('$settingsfolders', function($stateParams, $state, $rootScope, $safeApply, $crudController, $location){

    return function($scope){

      var path = $stateParams.path || '';
      var path_parts = path.split('/').filter(function(p){
        return p && p.length>0;
      })

      $scope.breadcrumbs = path_parts.map(function(part, index){
        return index + ':' + part;
      })

      $scope.add_mode = path_parts.length>0;
      var active_blueprint = null;
      $scope.path_parts = [].concat(path_parts);

      //$settingsFolderLoader($scope);

      $scope.breadcrumblink = function(index){
        return '/' + $scope.urlbase + '/' + ($scope.breadcrumbs || []).slice(0, index+1).join('/');
      }

      $scope.settingsid = path_parts[path_parts.length-1];

      $scope.settings_startoptions = [{
        id:'',
        name:$scope.urlbase
      }];

      //we want to know what blueprint is being added to these folders
      //we load all ancestors and use the lowest as priority
      //we are looking for a blueprint attribute

      if(path_parts.length>0){      

        // make a selector for each folder id
        // -> folder#materials, folder#wood

        var selector = path_parts.map(function(folderid){
          return 'folder#' + folderid;
        }).join(' > ')

        $scope.breadcrumbs = path_parts.map(function(part){
          return part;
        })

        $scope
          .warehouse(selector)
          .ship(function(results){

            // load the ancestors so we know what the blueprint is
            results('<< *').ship(function(ancestors){

              var blueprint = null;
              ancestors.each(function(ancestor){
                if(ancestor.attr('blueprint')){
                  blueprint = ancestor.attr('blueprint');
                }
              })
              active_blueprint = blueprint;
              
              $scope.$emit('activecontainer_loaded', results, ancestors);
              $scope.$emit('blueprint_loaded', blueprint);
            })

          })
      }

    
      $scope.$on('results', function($ev, results){
        
      })

      $scope.$on('parent', function($ev, parent){
        $scope.selectedsettingid = parent.diggerid();
      })

      $scope.choosesettingsfolder = function(folder){
        if(!folder){
          return;
        }
        $location.path($scope.urlbase + (folder.url ? '/' + folder.url : ''));
      }

      function foldersaved(){
        document.location.reload();
      }

      $scope.$on('select', function($ev, container){
        if(container.is('folder')){

          var url = path_parts.concat([container.id()]).filter(function(part){
            return part && part.match(/\w/);
          }).join('/');

          var url = $scope.urlbase + '/' + url;

          $location.path(url);
          
        }
      })

      $crudController($scope, {
        folder_mode:true,
        add_mode:$scope.add_mode,
        foldersaved:foldersaved,
        blueprint:function(){

          return active_blueprint;
          
        },

        selector_base:$scope.selectorbase,
        selector_path:$stateParams.path
        //parent_selector:get_selector(),
        //selector:get_selector(true)
      })

      $scope.$watch('results', function(results){
        if(!results){
          return;
        }

        $scope.folders = results.find('folder').containers();

        $scope.items = results.filter(function(result){
          return result.tag()!='folder';
        }).containers();


      })
    }

  })

    
