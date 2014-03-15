var modulename = module.exports = 'digger.admin';

var templates = {
  simpletable:require('./simpletable'),
  simpleeditor:require('./simpleeditor'),
  crudeditor:require('./crudeditor')
}

angular
  .module(modulename, [
    require('digger-editor'),
    require('file-uploader')
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


  .directive('crudEditor', function($safeApply, $containerTreeData, $getAncestors, $pathSelector){

    //field.required && showvalidate && containerForm[field.name].$invalid
    return {
      restrict:'EA',
      scope:{
        container:'=',
        settings:'='
      },
      replace:true,
      transclude:true,
      template:templates.crudeditor,
      controller:function($scope){

        $scope.showform = false;

        $scope.selector = {
          limit:'0,100',
          search:''
        }

        $scope.edit_container = $scope.container;
        $scope.mode = 'overview';

        var load_trigger = null;

        $scope.run_selector = function(){
          var selector = '> *' + ($scope.selector.limit ? ':limit(' + $scope.selector.limit + ')' : '');// + ($scope.selector.sort ? ':sort(' + $scope.selector.sort + ')' : '');
          
          $scope.edit_container(selector).ship(function(children){
            
            $safeApply($scope, function(){

              $scope.folders = children.find('folder').containers();
              $scope.items = children.find('folder:not').containers();

            })
          })
        }

        $scope.$watch('selector', function(selector){
          $scope.run_selector();
        }, true)

        // load the tree data
        $scope.$watch('container', function(container){
          if(!container){
            return container;
          }
          container('> *:tree(folder)').ship(function(tree){
            $safeApply($scope, function(){
              container.get(0)._children = tree.models;
              $scope.tree_root = container;
              $scope.$emit('crud:tree:loaded');
            })
          })
        })


        $scope.$on('tree:selected', function($e, container){
          
          $scope.edit_container = container;
          $scope.run_selector();
          
        })

        $scope.$on('editor:mode', function($ev, mode){
          $scope.mode = mode;
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

  .directive('simpleEditor', function($growl, $safeApply){

    return {
      restrict:'EA',
      scope:{
        container:'=',
        settings:'='
      },
      replace:true,
      transclude:true,
      template:templates.simpleeditor,
      controller:function($scope){

        $scope.settings = $scope.settings || {};
        $scope.folderblueprint = $digger.blueprint.get('folder');

        $scope.updatecontainer = function(){
          $scope.itemtype = $scope.container.tag();
          $scope.edit_mode = $scope.container.tag()!='_supplychain';
          $scope.addbuttons = $scope.settings.blueprintfn ? $scope.settings.blueprintfn($scope.container) : ['folder'];
          $scope.$emit('editor:update', $scope.container);
        }

        $scope.$watch('container', function(container){
          if(!container){
            return;
          }
          $scope.updatecontainer();
        })

        $scope.addclicked = function(blueprintname){
          $scope.blueprintname = blueprintname;
          $scope.edit_container = $digger.blueprint.create(blueprintname || 'folder');
          $scope.blueprint = $digger.blueprint.get(blueprintname || 'folder');

          $scope.formtitle = 'New ' + ($scope.blueprintname.replace(/^./, function(st){
            return (st || '').toUpperCase();
          }));

          $scope.formactiontitle = 'Add';
          $scope.showform = true;
          $scope.addingmode = true;
          $scope.editing = true;

          $scope.$emit('editor:new', $scope.edit_container);
          $scope.$emit('editing');
        }
        
        $scope.editrow = function(row){
          $scope.clickmode = 'edit';
          $scope.showadd = false;
          $scope.showdelete = false;

          $scope.formtitle = row.title();
          $scope.formactiontitle = 'Save';
          $scope.edit_container = row;
          $scope.showform = true;
          $scope.addingmode = false;
          $scope.editing = true;

          $scope.canceldata = JSON.parse(JSON.stringify(row.models))

          $scope.$emit('editor:select', row);
          $scope.$emit('editing');
        }

        $scope.deleterow = function(row, event){
          $scope.formtitle = 'Delete?';
          $scope.edit_container = row;
        }

        $scope.cancelform = function(){
          $scope.formactiontitle = 'Add';
          $scope.showform = false;
          $scope.addingmode = false;
          $scope.showfolderform = false;
          $scope.showdelete = false;
          $scope.editing = false;
          $scope.showadd = $scope.add_mode;
          if($scope.canceldata){
            $scope.edit_container.models = $scope.canceldata;  
          }
          $scope.canceldata = null;

/*
          if($scope.edit_container){
            $location.hash($scope.edit_container.diggerid());
            $anchorScroll();
          }
*/
          
          $scope.edit_container = null;
          $scope.$emit('notediting');
        }

        $scope.confirmdelete = function(){
          var title = $scope.edit_container.title();
          
          $scope.showform = false;
          $scope.showdelete = false;
          $scope.editing = false;
          $scope.showadd = $scope.add_mode;

          var removing = $scope.edit_container;

          $scope.edit_container = null;
          removing.remove().ship(function(){
            $growl(title + " removed");
            $scope.$emit('notediting');
            $scope.$emit('editor:delete', removing);
            //load_containers();
            
          })
        }    

        $scope.submitform = function(){

          function normal_add(newcontainer){

            $scope.container.append(newcontainer).ship(function(){
              $growl(newcontainer.title() + " added");
              
              $scope.$emit('editor:add', newcontainer);
              if($scope.settings.post_append){
                $scope.settings.post_append(newcontainer);
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
              $growl(savecontainer.title() + " saved");

              $scope.$emit('editor:save', savecontainer);
              $safeApply($scope, function(){
                $scope.cancelform();
              })
            })
            
          }

          if($scope.clickmode=='add'){
            var newcontainer = $scope.edit_container;

            if($scope.settings.process_add){
              $scope.settings.process_add(newcontainer, function(){
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

            if($scope.settings.process_save){
              $scope.settings.process_save(savecontainer, function(){
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
        rows:'=',
        iconfn:'=',
        search:'='
      },
      replace:true,
      template:templates.simpletable,
      link:function($scope, elem, $attrs){

        $scope.showsummary = true;
      }
    }
  })

  .factory('$growl', function(){
    return function(message, type){
      type = type || 'info';
      //window.scrollTo(0,0);

      var appendto = $('.add-growl');

      var elemselector = appendto.length>0 ? appendto : 'body';
      $.bootstrapGrowl(message, {
        ele: elemselector, // which element to append to
        type: type, // (null, 'info', 'error', 'success')
        offset: {from: 'top', amount: 20}, // 'top', or 'bottom'
        align: 'right', // ('left', 'right', or 'center')
        width: 250, // (integer, or 'auto')
        delay: 4000,
        allow_dismiss: true,
        stackup_spacing: 10 // spacing between consecutively stacked growls.
      });
    }
  })