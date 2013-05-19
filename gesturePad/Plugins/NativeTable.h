//
//  NativeTable.h
//  NativeTableExample
//
//  Created by Spartak B 
//  Copyright (c) 2011 Develocorp Inc. All rights reserved.
//

#import <Cordova/CDVPlugin.h>
#import <UIKit/UIKit.h>
#import <CoreData/CoreData.h>

@interface NativeTable : CDVPlugin <UITableViewDelegate,UITableViewDataSource>{

	CGRect _originalWebViewFrame;
	NSArray* _mainTableData;
	NSString* _mainTableTitle;
	CGFloat _mainTableHeight;
    CGFloat _offsetTop;
    NSMutableArray* _searchResults;
	BOOL *isFiltered;
}


@property (nonatomic, assign) UITableView *mainTableView;
@property (nonatomic, assign) UISearchBar *searchBar;
@property (nonatomic, assign) UINavigationBar *navBar;
@property (nonatomic, assign) UISearchDisplayController *searchController;
@property (readonly, strong, nonatomic) NSManagedObjectContext *managedObjectContext;

- (void)createTable:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)setTableTitle:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)setTableData:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)showTable:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)hideTable:(NSArray*)arguments withDict:(NSDictionary*)options;

@end
