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

  .factory('$pathSelector', function() {

    return function(path){

      return (path || '').split('/').filter(function(id){
        return id && id.match(/\w/);
      }).map(function(id){
        return 'folder#' + id;
      }).join(' > ')
      
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



  .directive('crudEditor', function($safeApply, $containerTreeData, $getAncestors, $pathSelector, $crudController){

    //field.required && showvalidate && containerForm[field.name].$invalid
    return {
      restrict:'EA',
      scope:{
        container:'=',
        settings:'=',
        blueprint:'='
      },
      replace:true,
      transclude:true,
      template:templates.crudeditor,
      controller:function($scope){

        // load the tree data
        $scope.$watch('container', function(container){
          if(!container){
            return container;
          }

          console.log('-------------------------------------------');
          console.log('loading folder tree');
          container('> *:tree(folder)').ship(function(){
            console.log('-------------------------------------------');
            console.dir(container.toJSON());
            $safeApply($scope, function(){
              $scope.$emit('crud:tree:loaded');
              $scope.tree_root = container;
            })
          })
        })

        console.log('-------------------------------------------');
        console.dir('blueprint');
        console.dir($scope.blueprint.toJSON());
        
        

        //$crudController($scope, $scope.settings);
          



/*

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

        */
      
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

  .directive('simpleEditor', function(){

    return {
      restrict:'EA',
      scope:{
        container:'=',
        blueprint:'=',
        settings:'='
      },
      replace:true,
      transclude:true,
      template:templates.simpleeditor,
      controller:function($scope){

        $scope.blueprintname = $scope.blueprint.title();
        $scope.itemtype = $scope.container.tag();
        $scope.showadd = true;//$scope.add_mode;
        $scope.showform = false;
        $scope.showdelete = false;
        $scope.folderblueprint = $digger.blueprint.get('folder');

        $scope.options = $scope.options || {};

        $scope.addclicked = function(){
          $scope.showadd = false;
          $scope.showdelete = false;

          $scope.edit_container = $digger.blueprint.create($scope.blueprintname);

          $scope.formtitle = 'New ' + ($scope.blueprintname.replace(/^./, function(st){
            return (st || '').toUpperCase();
          }));

          $scope.formactiontitle = 'Add';
          $scope.showform = true;
          $scope.addingmode = true;

          $scope.$emit('editor:new', $scope.edit_container);
          $scope.$emit('editing');
        }

        $scope.addfolderclicked = function(){
          
          $scope.showadd = false;
          $scope.showdelete = false;
          $scope.addingmode = false;

          $scope.edit_folder = $digger.create('folder');

          $scope.formtitle = 'Add Folder';

          $scope.formactiontitle = 'Add';

          $scope.showfolderform = true;
          $scope.$emit('editing');
        }

        $scope.editfolderclicked = function(){
          
          $scope.showadd = false;
          $scope.showdelete = false;
          $scope.addingmode = false;

          $scope.edit_folder = $digger.create('folder');

          $scope.formtitle = 'Add Folder';

          $scope.formactiontitle = 'Add';

          $scope.showfolderform = true;
          $scope.$emit('editing');
        }


        $scope.cancelfolderform = function(){
          $scope.cancelform();
          $scope.$emit('notediting');
        }


        $scope.submitfolderform = function(){

          if($scope.formactiontitle=='Add'){
            var addfolder = $scope.edit_folder;
            addfolder.id(addfolder.attr('name').replace(/\s+/g, '_').replace(/\W/g, '').toLowerCase());
            $scope.container.append(addfolder).ship(function(){
              $scope.$emit('editor:growl', addfolder.title() + ' added');
              //load_containers();
              $safeApply($scope, function(){
                $scope.cancelform();
              })
            })
          }
          else{
            $scope.edit_folder.save().ship(function(){
              $scope.$emit('editor:growl', $scope.edit_folder.title() + " saved");
              if(options.foldersaved){
                options.foldersaved($scope.edit_folder);
              }
              //load_containers();
              $safeApply($scope, function(){
                $scope.cancelform();
              })
            });
          }

          
        }


        $scope.editrow = function(row){
          $scope.showadd = false;
          $scope.showdelete = false;

          $scope.formtitle = row.title();
          $scope.formactiontitle = 'Save';
          $scope.edit_container = row;
          $scope.showform = true;
          $scope.addingmode = false;

          $scope.canceldata = JSON.parse(JSON.stringify(row.models))

          $scope.$emit('editor:select', row);
          $scope.$emit('editing');
        }

        $scope.deleterow = function(row, event){
          $scope.formtitle = 'Delete?';
          $scope.showdelete = true;
          $scope.showform = false;
          $scope.showadd = false;
          $scope.addingmode = false;
          $scope.edit_container = row;
        }

        $scope.cancelform = function(){
          $scope.formactiontitle = 'Add';
          $scope.showform = false;
          $scope.addingmode = false;
          $scope.showfolderform = false;
          $scope.showdelete = false;
          $scope.showadd = $scope.add_mode;
          if($scope.canceldata){
            $scope.edit_container.models = $scope.canceldata;  
          }
          $scope.canceldata = null;

          if($scope.edit_container){
            $location.hash($scope.edit_container.diggerid());
            $anchorScroll();
          }
          
          $scope.edit_container = null;
          $scope.$emit('notediting');
        }

        $scope.confirmdelete = function(){
          var title = $scope.edit_container.title();
          
          $scope.showform = false;
          $scope.showdelete = false;
          $scope.showadd = $scope.add_mode;

          var removing = $scope.edit_container;

          $scope.edit_container = null;
          removing.remove().ship(function(){
            $scope.$emit('editor:growl', title + " removed");
            $scope.$emit('notediting');
            $scope.$emit('container:delete', removing);
            //load_containers();
            
          })
        }    

        $scope.submitform = function(){

          function normal_add(newcontainer){

            $scope.container.append(newcontainer).ship(function(){
              $scope.$emit('editor:growl', newcontainer.title() + " added");
              
              $scope.$emit('container:add', newcontainer);
              load_containers();
              if(options.post_append){
                options.post_append(newcontainer);
              }
              else{
                
                $safeApply($scope, function(){
                  $scope.cancelform();
                })
              }
              
            })
          }

          function normal_save(savecontainer){

            savecontainer.save().ship(function(){
              $scope.$emit('editor:growl', savecontainer.title() + " saved");

              $scope.$emit('container:save', savecontainer);
              load_containers();
              $safeApply($scope, function(){
                $scope.cancelform();
              })
            })
            
          }

          if($scope.formactiontitle=='Add'){
            var newcontainer = $scope.edit_container;

            if($scope.options.process_add){
              $scope.options.process_add(newcontainer, function(){
                $safeApply($scope, function(){
                  normal_add(newcontainer);
                })
              })
            }
            else{
              normal_add(newcontainer);
            }

          }
          else{
            var savecontainer = $scope.edit_container;

            if($scope.options.process_save){
              $scope.options.process_save(savecontainer, function(){
                $safeApply($scope, function(){
                  normal_save(savecontainer);
                })
              })
            }
            else{
              normal_save(savecontainer);
            }

          }
        }
      }
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