var modulename = module.exports = 'digger.admin';

var templates = {
  simpletable:require('./simpletable'),
  simpleeditor:require('./simpleeditor'),
  crudeditor:require('./crudeditor')
}

angular
  .module(modulename, [
    require('digger-editor'),
    require('file-uploader'),
    require('./crud')
  ])

  .directive('crudEditor', function($safeApply, $settingsfolders, $containerTreeData, $getAncestors){

    //field.required && showvalidate && containerForm[field.name].$invalid
    return {
      restrict:'EA',
      scope:{
        title:'=',
        warehouse:'=',
        blueprints:'=',
        settings:'='
      },
      replace:true,
      template:templates.crudeditor,
      controller:function($scope){
        $settingsfolders($scope);


        $scope.$on('editing', function(){
          $scope.editing = true;
        })

        $scope.$on('notediting', function(){
          $scope.editing = false;
        })

        $scope.$on('tree:selected', function($e, container){
          
          var ancestors = $getAncestors($scope.resources_root, container) || [];

          // create the url from the #ids mapped into a path
          var url = [''].concat(ancestors.map(function(ancestor){
            return ancestor.id();
          })).concat([container.id()]).join('/');

          $location.path(url);

          $scope.cancelform();
          
        })

        // this means the container pointed to via the URL has been loaded
        $scope.$on('activecontainer_loaded', function($e, container, ancestors){

          $containerTreeData.load($scope, $scope.selectorbase).then(function(tree){
            $scope.resources_root = tree;

            setTimeout(function(){
              $safeApply($scope, function(){
                
                var resources_seen = false;
                ancestors.each(function(ancestor){
                  if(!resources_seen){
                    if(ancestor.id()=='resources'){
                      resources_seen = true;
                    }
                    return;
                  }
                  $scope.$broadcast('tree:expand', ancestor);
                })

              })
            }, 200)
            
            $scope.$broadcast('tree:select', container, ancestors);
            
          })
      
          


        })

        $scope.$on('blueprint_loaded', function($ev, blueprintname){
          //var blueprint = $digger.blueprint.get(blueprintname);
          //$scope.timebased = blueprint.hasClass('time');
        })

      
      },
      link:function($scope, $elem, $attrs){
        
        // back to top
        setTimeout(function () {

          $('#treeholder').affix({
            offset: {
              top: 0
            , bottom: function () {
                return (this.bottom = $('#footer').outerHeight(true))
              }
            }
          })
            
        }, 100)
      }
    }
  })

  .directive('folderEditor', function($safeApply){

    //field.required && showvalidate && containerForm[field.name].$invalid
    return {
      restrict:'EA',
      scope:{
        title:'=',
        warehouse:'=',
        blueprints:'=',
        settings:'='
      },
      replace:true,
      template:'<div><digger-editor container="container" settings="settings" /></div>)',
      controller:function($scope){

      },
      link:function($scope, $elem, $attrs){

        if($scope.blueprints){
          $digger.blueprint.load([
            $scope.blueprints
          ]);
        }
        
        $scope.container = $digger.connect(options.warehouse);
        $scope.container.attr('name', options.title);

        $scope.settings = $scope.settings;

        $scope.depth = $scope.depth || 4;
        $scope.treedata = [];
        
        $scope.$watch('container', function(container){
          if(!container){
            return;
          }

          container.recurse(function(c){
            c.data('showattributes', true);
          })

          $scope.treedata = container.models;

        })
      }
    }
  })


  .directive('simpleEditor', function(){


    //field.required && showvalidate && containerForm[field.name].$invalid
    return {
      restrict:'EA',
      replace:true,
      transclude:true,
      template:templates.simpleeditor
    }
  })

  .directive('simpleTable', function(){


    //field.required && showvalidate && containerForm[field.name].$invalid
    return {
      restrict:'EA',
      scope:{
        selected:'=',
        rows:'=',
        showsummary:'@',
        selectrow:'&',
        deleterow:'&',
        search:'='
      },
      replace:true,
      transclude:true,
      template:templates.simpletable,
      link:function($scope, elem, $attrs){

        $scope.showsearch = ($attrs.showsearch || '').match(/\w/);


      }
    }
  })