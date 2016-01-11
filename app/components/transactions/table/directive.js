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
                return updateTransactions('POST', 'transactions/' + transaction, transaction);
            };

            this.delete = function(transaction) {
                return updateTransactions('DELETE', 'transactions/' + transaction.id, transaction);
            };

            this.edit = function(transaction) {
                return updateTransactions('PUT', 'transactions/' + transaction.id, transaction);
            };

            function updateTransactions(method, url, transaction) {
                var deferred = $q.defer();

                transactionsService.service(method, url, transaction).then(function() {
                    transactionsService.service('GET', 'transactions').then(function(response){
                        $scope.transactions = response;
                        deferred.resolve(true);
                    });
                });

                return deferred.promise;
            }

        },
        link: function(scope, element, attrs) {

        }
    }
});