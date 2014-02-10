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

@interface NativeTable : CDVPlugin <UITableViewDelegate,UITableViewDataSource, UISearchBarDelegate> {
	NSArray* _mainTableData;
	NSString* _mainTableTitle;
    NSMutableArray* _searchResults;
	BOOL isFiltered;

}

extern UIColor *newGrey;

@property (nonatomic, strong) UITableView *mainTableView;
@property (nonatomic, strong) UIViewController *vc;
@property (nonatomic, strong) UISearchBar *searchBar;
@property (nonatomic, strong) UINavigationBar *navbar;
@property (nonatomic, strong) UIToolbar *toolbar;
@property (nonatomic, strong) UIBarButtonItem *leftNavButton;
@property (nonatomic, strong) UIBarButtonItem *rightNavButton;

@property (nonatomic, strong) UISearchDisplayController *searchController;
@property (readonly, strong, nonatomic) NSManagedObjectContext *managedObjectContext;

- (void)createTable:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)setTableData:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)showTable:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)hideTable:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)scrollTo:(NSArray*)arguments withDict:(NSDictionary*)options;

@end



