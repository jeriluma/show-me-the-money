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
                $scope.headers = ['Date', 'Description', 'Account', 'Categories', 'Amount', 'Balance', 'Status'];
                $scope.getAccountName = function(transaction) {
                    return $filter('filter')($scope.accounts, function (d) {return d.id === transaction.id;})[0].name;
                };
                $scope.transactions = response;
            });

            $scope.addTransaction = function(transaction) {
                transactionsService.service('POST', 'transactions', transaction).then(getTransactions());
            };

            $scope.deleteTransaction = function(transaction) {
                transactionsService.service('DELETE', 'transactions/' + transaction.id).then(getTransactions());
            };

            this.editTransaction = function(transaction) {
                transactionsService.service('PUT', 'transactions/' + transaction.id, transaction).then(getTransactions());
            };

            function getTransactions() {
                transactionsService.service('GET', 'transactions').then(function(response){
                    $scope.transactions = response;
                });
            }

        },
        link: function(scope, element, attrs) {


        }
    }
});