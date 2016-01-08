app.directive('transactionsTable', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/table/view.html',
        controller: function($scope, transactionsService, $filter) {
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
            });

            $scope.addTransaction = function(transaction) {
                transactionsService.service('POST', 'transactions', transaction).then(getTransactions());
            };

            $scope.deleteTransaction = function(transaction) {
                transactionsService.service('DELETE', 'transactions/' + transaction.id).then(getTransactions());
            };

            this.transacting = false;
            this.edit = function(transaction) {
                this.gettingTransaction = true;

                transactionsService.service('PUT', 'transactions/' + transaction.id, transaction).then(
                    function(response) {
                        transactionsService.service('GET', 'transactions').then(function(response){
                            $scope.transactions = response;
                            this.transacting = false;
                        });
                    }
                );

            };

        },
        link: function(scope, element, attrs) {

        }
    }
});