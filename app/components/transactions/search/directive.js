app.directive('transactionsSearch', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/search/view.html',
        controller: function($scope, $filter, $q) {
            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
            $scope.headers = ['Date', 'Description', 'Account', 'Category', 'Amount', 'Balance', 'Status'];

            $scope.transactions = [];

            var date = new Date();
            $scope.filterProperties = {
                date: {
                    start: null,
                    end: date
                },
                description: '',
                accountId: '',
                categoryId: '',
                statusId: ''
            };

            $scope.$on('transactionsService:updated', function() {
                $scope.categories = transactionsService.getCategories();
                $scope.status = transactionsService.getStatus();
                $scope.accounts = transactionsService.getAccounts();
            });

            this.searchData = function() {
                var defer = $q.defer();
                transactionsService.searchTransactions($scope.filterProperties).then(function(response) {
                    $scope.transactions = response;
                    $scope.filterProperties = {
                        date: {
                            start: null,
                            end: date
                        },
                        description: '',
                        accountId: '',
                        categoryId: '',
                        statusId: ''
                    };
                    defer.resolve();
                });
                return defer.promise;
            };

        },
        link: function(scope, element, attrs, ctrl) {
            var syncElement = $(element).find('.transaction-sync');
            var searchElement = $(element).find('.transaction-search-element');

            syncElement.hide();

            scope.search = function(event) {
                if(event) {
                    event.preventDefault(); // prevents page refresh
                }

                searchElement.fadeOut().promise().done(function() {
                    syncElement.fadeIn().promise().done(function() {
                        ctrl.searchData().then(function() {
                            syncElement.fadeOut().promise().done(function() {
                                searchElement.fadeIn();
                            });
                        });
                    });
                });
            };
        }
    }
}]);