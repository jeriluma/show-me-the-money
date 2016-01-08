app.directive('transactionsEdit', function() {
    return {
        restrict: 'A',
        require: '^transactionsTable',
        link: function(scope, element, attrs, transactionsCtrl) {
            var editTrigger = $(element).find('.transaction-edit-hover');
            var editingElement = $(element).find('.transaction-editing');
            var isEditing = false;

            editTrigger.hide();
            editingElement.hide();

            $(element).bind('mouseover', function() {
                if(!isEditing) {
                    editTrigger.fadeIn();
                }
            });

            $(element).bind('mouseleave', function() {
                if(!isEditing) {
                    editTrigger.fadeOut();
                }
            });

            $(editTrigger).bind('click', function() {
                $(element).children().hide();
                isEditing = true;
                editingElement.fadeIn();
            });

            scope.save = function(transaction, event) {
                if(event) {
                    event.preventDefault(); // prevents page refresh
                }

                transactionsCtrl.edit(transaction);
            };

            scope.$watch(transactionsCtrl.transacting, function() {
                if(transactionsCtrl.transacting) {
                    isEditing = false;
                } else {
                    editingElement.fadeOut();
                }
            });
        }
    }
});