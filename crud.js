var modulename = module.exports = 'digger.admin.crud';

angular
  .module(modulename, [
    
  ])

  /*
  
    the controller we use a lot inside a factory
    
  */

  .factory('$crudController', function($safeApply, $location, $anchorScroll) {
    return function($scope, options){

      options = options || {};

      $scope.folder_mode = options.folder_mode;
      
      $scope.add_mode = options.add_mode;

      // if we are using the path (/folder/folder/folder)
      // then auto generate the selectors
      function get_path_selector(withcontents){

        if(!options.selector_base){
          return null;
        }

        var path_parts = (options.selector_path || '').split('/');

        var selectors = [options.selector_base];

        if(path_parts.length>0){
          selectors = selectors.concat(path_parts.filter(function(id){
            return id && id.match(/\w/);
          }).map(function(id){
            return 'folder#' + id;
          }))  
        }

        if(withcontents){
          selectors.push('*:sort(name)');  
        }

        var ret = selectors.join(' > ');
        return ret;
      }

      $scope.$on('crud:reload', function(){
        load_containers();
      })


      function load_containers(){

        load_parent(function(){
          var selector = '';

          if(options.selector_base){
            selector = get_path_selector(true);
          }
          else{
            selector = options.selector;
          }

          if(typeof(selector)==='function'){
            selector = selector();
          }

          if($digger.config.debug){
            console.log('loading children: ' + selector);  
          }

          $scope
            .warehouse(selector)
            .ship(function(results){
              $safeApply($scope, function(){
                $scope.results = results;
                $scope.containers = results.containers();
                $scope.$emit('results', results);
              })
            })  
        });

      }

      function load_parent(done){
        // 'folder#clients > *:sort(name)'
        
        var selector = '';

        if(options.selector_base){
          selector = get_path_selector();
        }
        else{
          selector = options.selector;
        }

        if(typeof(selector)==='function'){
          selector = selector();
        }

        if($digger.config.debug){
          console.log('loading parent: ' + selector);  
        }

        var contract = $scope
          .warehouse(selector)
          .ship(function(results){

            $safeApply($scope, function(){

              $scope.parent = results;
              $scope.$emit('parent', results);
              done && done();
            })
            
          })
      }

      function get_blueprint_name(){
        var blueprint = options.blueprint || 'folder';

        if(typeof(blueprint)==='function'){
          blueprint = blueprint();
        }

        return blueprint;
      }

      function get_blueprint(){
        return $digger.blueprint.get(get_blueprint_name());
      }

      $scope.showadd = $scope.add_mode;
      $scope.showform = false;
      $scope.showdelete = false;

      load_containers();

      $scope.addclicked = function(){
        $scope.showadd = false;
        $scope.showdelete = false;

        var blueprint =  get_blueprint();

        $scope.edit_container = $digger.blueprint.create(get_blueprint_name());

        $scope.formtitle = 'New ' + (get_blueprint_name().replace(/^./, function(st){
          return (st || '').toUpperCase();
        }));

        $scope.formactiontitle = 'Add';
        $scope.blueprint = blueprint;
        $scope.showform = true;
        $scope.addingmode = true;

        $scope.$emit('new', $scope.edit_container);
        $scope.$emit('editing');
      }

      $scope.addfolderclicked = function(){
        
        $scope.folderblueprint = $digger.blueprint.get('folder');
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
        
        $scope.folderblueprint = $digger.blueprint.get('folder');
        $scope.showadd = false;
        $scope.showdelete = false;
        $scope.addingmode = false;

        $scope.edit_folder = $scope.parent;

        $scope.formtitle = 'Save Folder';

        $scope.formactiontitle = 'Save';

        $scope.showfolderform = true;
        $scope.$emit('editing');
      }

      $scope.cancelfolderform = function(){
        $scope.folderblueprint = {
          fields:[]
        }
        $scope.cancelform();
        $scope.$emit('notediting');
      }

      $scope.submitfolderform = function(){

        if($scope.formactiontitle=='Add'){
          var addfolder = $scope.edit_folder;
          addfolder.id(addfolder.attr('name').replace(/\s+/g, '_').replace(/\W/g, '').toLowerCase());
          $scope.parent.append($scope.edit_folder).ship(function(){
            $.growl.notice({ message: addfolder.title() + " added" });
            load_containers();
            $safeApply($scope, function(){
              $scope.cancelform();
            })
          })
        }
        else{
          $scope.edit_folder.save().ship(function(){
            $.growl.notice({ message: $scope.edit_folder.title() + " saved" });
            if(options.foldersaved){
              options.foldersaved($scope.edit_folder);
            }
            load_containers();
            $safeApply($scope, function(){
              $scope.cancelform();
            })
          });
        }

        
      }

      $scope.editrow = function(row){
        $scope.showadd = false;
        $scope.showdelete = false;

        var blueprint =  $digger.blueprint.get(get_blueprint_name());

        $scope.formtitle = row.title();
        $scope.formactiontitle = 'Save';
        $scope.edit_container = row;
        $scope.blueprint = blueprint;
        $scope.showform = true;
        $scope.addingmode = false;

        $scope.canceldata = JSON.parse(JSON.stringify(row.models))

        $scope.$emit('select', row);
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
        $scope.blueprint = {
          fields:[]
        }
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
          $.growl.notice({ message: title + " removed" });

          $scope.$emit('notediting');
          $scope.$emit('container:delete', removing);
          load_containers();
          
        })
      }    

      $scope.submitform = function(){

        function normal_add(newcontainer){

          $scope.parent.append(newcontainer).ship(function(){
            $.growl.notice({ message: newcontainer.title() + " added" });
            
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
            $.growl.notice({ message: savecontainer.title() + " saved" });
            $scope.$emit('container:save', savecontainer);
            load_containers();
            $safeApply($scope, function(){
              $scope.cancelform();
            })
          })
          
        }

        if($scope.formactiontitle=='Add'){
          var newcontainer = $scope.edit_container;

          if(options.process_add){
            options.process_add(newcontainer, function(){
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

          if(options.process_save){
            options.process_save(savecontainer, function(){
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
  })
