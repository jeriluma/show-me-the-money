app.directive('transactionsDelete', function() {
    return {
        restrict: 'A',
        scope: true,
        controller: function($scope, transactionsService, $mdDialog, $q) {

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
                    $scope.$emit('UPDATE_DATA_POST_COMPLETE', false);
                    transactionsService.service('DELETE', 'transactions/' + transaction.id).then(function() {
                        $scope.$emit('UPDATE_DATA_POST_COMPLETE', true);
                        defer.resolve();
                    });
                }, function() {
                    // cancel
                });

                return defer.promise
            };
        },
        link: function(scope, element, attrs, ctrl) {
            var deleteTrigger = $(element).find('.transaction-delete-trigger');
            var isEditing = false;
            deleteTrigger.hide();

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
                    ctrl.deleteData(event, transaction).then(function() {
                        isEditing = false;
                    });
                });
            };
        }
    }
});