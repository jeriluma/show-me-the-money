app.directive('transactionsTable', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/table/view.html',
        controller: function($scope, transactionsService, $q) {
            $scope.loading = true;

            transactionsService.service('GET', 'categories').then(function(response){
                $scope.categories = response;
            });

            transactionsService.service('GET', 'status').then(function(response){
                $scope.status = response;
            });

            transactionsService.service('GET', 'accounts').then(function(response){
                $scope.accounts = response;
            });

            transactionsService.service('GET', 'transactions').then(function(response){
                $scope.headers = ['ID', 'Date', 'Description', 'Account', 'Category', 'Amount', 'Balance', 'Status'];
                $scope.transactions = response;
                $scope.loading = false;
            });

            this.add = function(transaction) {
                return updateTransactions('POST', 'transactions/', transaction);
            };

            this.edit = function(transaction) {
                return updateTransactions('PUT', 'transactions/' + transaction.id, transaction);
            };

            function updateTransactions(method, url, transaction) {
                var defer = $q.defer();

                transactionsService.service(method, url, transaction).then(function() {
                    transactionsService.service('GET', 'transactions').then(function(response){
                        $scope.transactions = response;
                        defer.resolve();
                    });
                });

                return defer.promise;
            }
            var checkedIds = [];
            $scope.checked = function(transaction) {

                if(checkedIds.indexOf(transaction.id) !== -1) {
                    checkedIds.splice(checkedIds.indexOf(transaction.id), 1);
                } else {
                    checkedIds.push(transaction.id);
                }
            };

            this.delete = function() {
                var defer = $q.defer();
                var promises  = [];

                angular.forEach(checkedIds,function(id){
                    promises.push(updateTransactions('DELETE', 'transactions/' + id));
                });

                $q.all(promises).then(function() {
                    checkedIds = [];
                    defer.resolve();
                });

                return defer.promise;
            };


        },
        link: function(scope, element, attrs, ctrl) {
            var deleteElement = $(element).find('.transactions.delete .transaction-delete');
            var syncElement = $(element).find('.transactions.delete .transaction-sync');
            syncElement.hide();

            scope.delete = function() {
                deleteElement.fadeOut().promise().done(function() {
                    syncElement.fadeIn().promise().done(function() {
                        ctrl.delete().then(function() {
                            syncElement.fadeOut().promise().done(function(){
                                deleteElement.fadeIn();
                            });
                        });
                    });
                });
            }
        }
    }
});