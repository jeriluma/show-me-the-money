app.directive('transactionsTable', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            type: '@',
            filter: '='
        },
        templateUrl: 'app/components/transactions/table/view.html',
        controller: function($scope, transactionsService) {
            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
            $scope.headers = ['Date', 'Description', 'Account', 'Category', 'Amount', 'Balance', 'Status'];
            $scope.transactions = [];

            $scope.transformDate = function(date) {
                return new Date(date);
            };

            $scope.$on('transactionsService:init', function() {
                $scope.categories = transactionsService.getCategories();
                $scope.status = transactionsService.getStatus();
                $scope.accounts = transactionsService.getAccounts();
            });

            $scope.$on('transactionsService:updated', function() {
                if($scope.type === 'credit') {
                    $scope.transactions = transactionsService.getCreditTransactions();
                } else if($scope.type === 'draft') {
                    $scope.transactions = transactionsService.getDraftTransactions();
                } else if(typeof $scope.type === 'undefined'){
                    $scope.transactions = transactionsService.getTransactions();
                }
            });

            $scope.$on('transactionsService:search', function() {
                $scope.transactions = transactionsService.getSearchResults();
            });
        },
        link: function(scope, element, attrs, ctrl) {

        }
    }
});