app.directive('transactionsDelete', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'A',
        scope: true,
        controller: function($scope, $mdDialog, $q) {

            this.deleteData = function(ev, transaction) {
                var defer = $q.defer();
                var translation = transaction.description;

                var confirm = $mdDialog.confirm()
                    .title('Would you like to delete this transaction?')
                    .textContent(translation)
                    .ariaLabel(transaction.description)
                    .targetEvent(ev)
                    .ok('Yes')
                    .cancel('No');

                $mdDialog.show(confirm).then(function() {
                    defer.resolve('delete');
                }, function() {
                    defer.resolve('cancel');
                });

                return defer.promise
            };

            this.updateData = function(transaction) {
                return transactionsService.deleteTransaction(transaction);
            };
        },
        link: function(scope, element, attrs, ctrl) {
            var deleteTrigger = $(element).find('.transaction-delete-trigger');
            var syncElement = $(element).find('.transaction-sync');
            var isEditing = false;
            deleteTrigger.hide();
            syncElement.hide();

            $(element).bind('mouseover', function() {
                if(!isEditing) {
                    deleteTrigger.fadeIn();
                }
            });

            $(element).bind('mouseleave', function() {
                if(!isEditing) {
                    deleteTrigger.fadeOut();
                }
            });

            scope.delete = function(event, transaction) {
                isEditing = true;
                deleteTrigger.fadeIn().promise().then(function() {
                    ctrl.deleteData(event, transaction).then(function(response) {
                        if(response === 'delete') {
                            deleteTrigger.fadeOut().promise().then(function() {
                                syncElement.fadeIn().promise().then(function() {
                                    ctrl.updateData(transaction).then(function() {
                                        isEditing = false;
                                    });
                                });
                            });
                        } else { // cancel
                            deleteTrigger.fadeOut().promise().then(function() {
                                    isEditing = false;
                            });
                        }
                    });
                });
            };
        }
    }
}]);