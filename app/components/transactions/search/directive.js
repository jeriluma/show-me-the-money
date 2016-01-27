app.directive('transactionsSearch', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/search/view.html',
        controller: function($scope, $filter, $q) {
            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
            $scope.headers = ['Date', 'Description', 'Account',
                'Category', 'Amount', 'Balance', 'Status'];
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

            function initTransactions() {
                var defer = $q.defer();
                var promises  = [];

                transactionsService.service('GET', 'categories').then(function(response){
                    promises.push($scope.categories = response);
                });

                transactionsService.service('GET', 'status').then(function(response){
                    promises.push($scope.status = response);
                });

                transactionsService.service('GET', 'accounts').then(function(response){
                    promises.push($scope.accounts = response);
                });

                $q.all(promises).then(function() {
                    defer.resolve();
                });

                return defer.promise;
            }
            initTransactions();

            this.searchDone = function() {
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
                $scope.$apply();
                transactionsService.setFilterStatus(0);
            }

        },
        link: function(scope, element, attrs, ctrl) {
            var syncElement = $(element).find('.transaction-sync');
            var searchElement = $(element).find('.transaction-search-element');
            var isSearching = false;

            syncElement.hide();

            scope.search = function(event) {
                if(event) {
                    event.preventDefault(); // prevents page refresh
                }

                searchElement.fadeOut().promise().done(function() {
                    syncElement.fadeIn().promise().done(function() {
                        isSearching = true;
                        transactionsService.setFilterStatus(1);
                    });
                });
            };

            scope.$on('transactions:filter', function(event, data) {
                if(transactionsService.getFilterStatus() === 2 && isSearching) {
                    syncElement.fadeOut().promise().done(function() {
                        searchElement.fadeIn().promise().done(function() {
                            isSearching = false;
                            ctrl.searchDone();
                        });
                    });
                }
            });
        }
    }
}]);