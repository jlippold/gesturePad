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
	NSArray* _mainTableData;
	NSString* _mainTableTitle;
    NSMutableArray* _searchResults;
	BOOL isFiltered;
}

extern UIColor *newGrey;

@property (nonatomic, assign) UITableView *mainTableView;
@property (nonatomic, assign) UIViewController *vc;
@property (nonatomic, assign) UISearchBar *searchBar;
@property (nonatomic, assign) UINavigationBar *navbar;
@property (nonatomic, assign) UIToolbar *toolbar;
@property (nonatomic, assign) UIBarButtonItem *leftNavButton;
@property (nonatomic, assign) UIBarButtonItem *rightNavButton;

@property (nonatomic, assign) UISearchDisplayController *searchController;
@property (readonly, strong, nonatomic) NSManagedObjectContext *managedObjectContext;

- (void)createTable:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)setTableData:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)showTable:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)hideTable:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)scrollTo:(NSArray*)arguments withDict:(NSDictionary*)options;

@end



