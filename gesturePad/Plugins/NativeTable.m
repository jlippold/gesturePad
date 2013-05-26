//
//  NativeTable.m
//  NativeTableExample
//
//  Created by Spartak B
//  Copyright (c) 2011 Develocorp Inc. All rights reserved.
//

#import "NativeTable.h"

@implementation NativeTable;
@synthesize mainTableView = _mainTableView;
@synthesize searchBar = _searchBar;
@synthesize searchController = _searchController;
@synthesize managedObjectContext = _managedObjectContext;
@synthesize navBar = _navbar;

-(CDVPlugin*) initWithWebView:(UIWebView*)theWebView
{
    self = (NativeTable*)[super initWithWebView:theWebView];
    if (self)
	{
		//NSLog(@"NativeTable Initialized!");
        
    }
    
    return self;
}

- (void)dealloc
{
	[_mainTableView release];
	[_mainTableData release];
    [_searchResults release];
    [super dealloc];
}



#pragma mark - JS interface methods

- (void)createTable:(NSArray*)arguments withDict:(NSDictionary*)options
{
    CGRect navBarFrame = CGRectMake(0, 0, self.webView.superview.bounds.size.width, 44.0);
    _navbar = [[UINavigationBar alloc] initWithFrame:navBarFrame];
    
    if ( [[options objectForKey:@"navBarColor"] isEqualToString:@"black"] ) {
        _navbar.barStyle = UIBarStyleBlack;
    }
    
    UINavigationItem *navItem = [UINavigationItem alloc];
    NSString *navTitle = @"";
    navTitle = [options objectForKey:@"navTitle"];
    navItem.title = navTitle;
    
    if ( [[options objectForKey:@"showRightButton"] boolValue] == true) {
        NSString *RightButtonTitle = [options objectForKey:@"RightButtonText"];
        
        UIBarButtonItem *rightButton = [[UIBarButtonItem alloc] initWithTitle:RightButtonTitle
                                                                        style:UIBarButtonItemStyleDone
                                                                       target:self
                                                                       action:@selector(onRightButtonPress:) ];
        navItem.rightBarButtonItem = rightButton;
        [rightButton release];
    }
    
    if ( [[options objectForKey:@"showBackButton"] boolValue] == true) {
        
        NSString *backArrowString = @"\U000025C0\U0000FE0E"; //BLACK LEFT-POINTING TRIANGLE PLUS VARIATION SELECTOR
        
        UIBarButtonItem *backBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:backArrowString style:UIBarButtonItemStylePlain target:self action:@selector(onBackButtonPress:)];
        navItem.leftBarButtonItem = backBarButtonItem;
        [backBarButtonItem release];
        
    }
    
    
    [_navbar pushNavigationItem:navItem animated:false];
    [self.webView.superview addSubview:_navbar];
    [_navbar setHidden:YES];
    _offsetTop = 0.0f;
    
	[_mainTableView release];
	_mainTableView = [UITableView new];
	[_mainTableView setHidden:YES];
	[_mainTableView setDataSource:self];
	[_mainTableView setDelegate:self];
    
    _mainTableHeight = [[options objectForKey:@"height"] floatValue];
    
    if ( [[options objectForKey:@"showSearchBar"] boolValue] == true) {
        [self setupSearchBar];
    }
    if ( [[options objectForKey:@"showNavBar"] boolValue] == true) {
        [_navbar setHidden:NO];
        _offsetTop = 44.0f;
    }
    
    _searchResults = [NSMutableArray array];
	self.webView.superview.autoresizesSubviews = YES;
	[self.webView.superview addSubview:_mainTableView];
    
}

- (IBAction)onRightButtonPress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onRightButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (IBAction)onBackButtonPress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onBackButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}


- (void)setTableData:(NSArray*)arguments withDict:(NSDictionary*)options
{
	
	[_mainTableData release];
	_mainTableData = [[arguments objectAtIndex:0] copy];
	[_mainTableView reloadData];
	
}


- (void)setupSearchBar {
    
    _searchBar = [[UISearchBar alloc] initWithFrame:CGRectMake(0, 0, _mainTableView.frame.size.width, 44) ];
    _searchBar.delegate = self;
    _searchBar.showsCancelButton = YES;
    
    self.mainTableView.tableHeaderView = _searchBar;
    
    _searchController = [[UISearchDisplayController alloc] initWithSearchBar:_searchBar  contentsController:self.viewController ];
    _searchController.searchResultsDataSource = self;
    _searchController.searchResultsDelegate = self;
    _searchController.delegate = self;
    
    // scroll just past the search bar initially
    //CGPoint offset = CGPointMake(0, self.searchBar.frame.size.height);
    //self.mainTableView.contentOffset = offset;
    
}

- (void)searchBarTextDidBeginEditing:(UISearchBar *)theSearchBar {
    
}

- (void)searchBarTextDidEndEditing:(UISearchBar *)theSearchBar {
    if (_searchBar.text.length == 0) {
        isFiltered = NO;
        [_mainTableView reloadData];
    } else {
        isFiltered = YES;
        [self filterForTerm:_searchBar.text];
    }
}
- (void)searchBarCancelButtonClicked:(UISearchBar *)searchBar {
    searchBar.text=@"";
    [searchBar setShowsCancelButton:NO animated:YES];
    [searchBar resignFirstResponder];
}

- (BOOL)searchDisplayController:(UISearchDisplayController *)controller shouldReloadTableForSearchString:(NSString *)searchString {
    if (searchString.length == 0)
        isFiltered = NO;
    else
        isFiltered = YES;
    [self filterForTerm:searchString];
    return YES;
}

- (void)filterForTerm:(NSString *)term {
    NSMutableArray *results = [[NSMutableArray alloc] init];
    
    for(int i = 0; i < [_mainTableData count]; i++ ) {
        NSRange range = [[[_mainTableData objectAtIndex:i] valueForKey:@"textLabel"] rangeOfString:term options:NSCaseInsensitiveSearch];
        NSRange range2 = [[[_mainTableData objectAtIndex:i] valueForKey:@"detailTextLabel"] rangeOfString:term options:NSCaseInsensitiveSearch];
        if (range.location != NSNotFound || range2.location != NSNotFound  ) {
            [[_mainTableData objectAtIndex:i] setObject:[NSString stringWithFormat:@"%d", i] forKey:@"index"];
            [results addObject: [_mainTableData objectAtIndex:i]];
        }
    }
    
    _searchResults = results.copy;
    [_mainTableView reloadData];
}

- (void)showTable:(NSArray*)arguments withDict:(NSDictionary*)options
{
	if(nil == _mainTableView){
        [self createTable:nil withDict:nil];
	}
	
	if(NO == [_mainTableView isHidden]){
		return;
	}
    
	
	_originalWebViewFrame = self.webView.frame;
	
	CGRect mainTableFrame, CDWebViewFrame;
	
	CDWebViewFrame = CGRectMake(
                                _originalWebViewFrame.origin.x,
                                _originalWebViewFrame.origin.y,
                                _originalWebViewFrame.size.width,
                                _originalWebViewFrame.size.height - _mainTableHeight
                                );
	
	mainTableFrame = CGRectMake(
                                CDWebViewFrame.origin.x,
                                CDWebViewFrame.origin.y + (CDWebViewFrame.size.height + _offsetTop),
                                CDWebViewFrame.size.width,
                                _mainTableHeight-_offsetTop
                                );
	
    [self.webView setFrame:CDWebViewFrame];
	[_mainTableView setFrame:mainTableFrame];
	[_mainTableView setHidden:NO];
    [self fadeIn];
    
	//NSLog(@"ShowTable Called!");
    
}


- (void)hideTable:(NSArray*)arguments withDict:(NSDictionary*)options
{
    //    [self searchBarCancelButtonClicked:_searchBar];
    
    
	if(nil == _mainTableView){
        return;
	}
	
	if(YES == [_mainTableView isHidden]){
		return;
	}
    
    [_searchBar resignFirstResponder];
    
    
    [self fadeOut];
	
	[self.webView setFrame:_originalWebViewFrame];
    
	
}


#pragma mark - tableView delegate and datasource methods
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    int counter = 1;
    
    if ([tmp count] == 0) {
        return 0;
    }
    NSString *loopedHeader = [[tmp objectAtIndex:0] valueForKey:@"sectionHeader"];
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            counter++;
        }
    }
    // NSLog(@"Total Sections: %d", counter);
    [tmp release];
    return counter;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    //return isFiltered ? _searchResults.count : _mainTableData.count;
    
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    int counter = 0;
    int rowsInSection = 0;
    NSString *loopedHeader = @"";
    BOOL isCurrentSection = false;
    
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            isCurrentSection = false;
            if (counter == section) {
                isCurrentSection = true;
            }
            counter++;
        }
        
        if (isCurrentSection) {
            rowsInSection++;
        }
    }
    //    NSLog(@"Section: %d Count: %d", section, rowsInSection);
    [tmp release];
    return rowsInSection;
    
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section {
    // NSLog(@"Requesting: %d", section);
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    int counter = -1;
    NSString *loopedHeader = @"";
    NSString *retVal = @"";
    
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            counter++;
        }
        if (section == counter) {
            retVal = thisHeader;
        }
    }
    
    [tmp release];
    return retVal;
    
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *CellIdentifier = @"Cell";
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:CellIdentifier];
    if (cell == nil) {
        cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:CellIdentifier] autorelease];
    }
	int section = indexPath.section;
    int row = indexPath.row;
    
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    
    int counter = 0;
    int rowCounter = 0;
    int sectionRowCounter = 0;
    int actualRow = 0;
    NSString *loopedHeader = @"";
    BOOL isCurrentSection = false;
    
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            isCurrentSection = false;
            if (counter == section) {
                isCurrentSection = true;
            }
            counter++;
        }
        
        if (isCurrentSection) {
            if (sectionRowCounter == row ) {
                actualRow = rowCounter;
            }
            sectionRowCounter++;
        }
        rowCounter++;
    }
    //    NSLog(@"Section: %d Count: %d", section, rowsInSection);
    [tmp release];
    
    NSDictionary *item = [_mainTableData objectAtIndex:actualRow];
    if (isFiltered) {
        item = [_searchResults objectAtIndex:actualRow];
    }
    
    cell.textLabel.text = [item valueForKey:@"textLabel"];
    
	cell.textLabel.textColor = [UIColor blackColor];
	cell.textLabel.font = [UIFont systemFontOfSize:15];
    cell.detailTextLabel.text = [item valueForKey:@"detailTextLabel"];
    
	cell.detailTextLabel.textColor = [UIColor grayColor];
	cell.detailTextLabel.font = [UIFont systemFontOfSize:12];
    
    NSString *icon = [item valueForKey:@"icon"];
    
    if ([icon isEqualToString:@"none"]) {
        cell.accessoryType = UITableViewCellAccessoryNone;
    } else if ([icon isEqualToString:@"greyarrow"]) {
        cell.accessoryType = UITableViewCellAccessoryDisclosureIndicator;
    } else if ([icon isEqualToString:@"bluearrow"]) {
        cell.accessoryType = UITableViewCellAccessoryDetailDisclosureButton;
    } else {
        cell.accessoryType = UITableViewCellAccessoryNone;
    }
    
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
    
	int section = indexPath.section;
    int row = indexPath.row;
    
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    
    int counter = 0;
    int rowCounter = 0;
    int sectionRowCounter = 0;
    int actualRow = 0;
    NSString *loopedHeader = @"";
    BOOL isCurrentSection = false;
    
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            isCurrentSection = false;
            if (counter == section) {
                isCurrentSection = true;
            }
            counter++;
        }
        
        if (isCurrentSection) {
            if (sectionRowCounter == row ) {
                actualRow = rowCounter;
                if (isFiltered) {
                    //we have the searched item, but we need to pull the original index
                    actualRow = [[[tmp objectAtIndex:i] objectForKey:@"index"] intValue];
                }
            }
            sectionRowCounter++;
        }
        rowCounter++;
    }
    [tmp release];
    
    NSString * jsCallBack = [NSString stringWithFormat:@"window.plugins.NativeTable._onTableViewRowSelect(%d);", actualRow];
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

-(void)fadeIn
{
    CGRect r = [_mainTableView frame];
    r.origin.y = [_mainTableView frame].size.height;
    [_mainTableView setFrame:r];
    _mainTableView.alpha = 0;
    _navbar.alpha = 0;
    [_navbar setHidden:NO];
    [_mainTableView setHidden:NO];
    
    [UIView animateWithDuration:0.3
                          delay: 0.0
                        options:UIViewAnimationCurveEaseInOut
                     animations:^{
                         CGRect r = [_mainTableView frame];
                         r.origin.y = _offsetTop;
                         [_mainTableView setFrame:r];
                         _mainTableView.alpha = 1;
                         _navbar.alpha =1 ;
                     }
                     completion:^(BOOL finished){
                         [self.webView stringByEvaluatingJavaScriptFromString:@"window.plugins.NativeTable._onTableShowComplete();"];
                     }];
    
}

- (void) removeDim {
    //shitty hack
    for( UIView *subview in self.webView.superview.subviews ) {
        if( [subview isKindOfClass:[UIControl class]] ) {
            UIControl *v = (UIControl*)subview;
            if (v.alpha < 1) {
                v.hidden = YES;
            }
        }
    }
    
}

-(void)fadeOut
{
    
    CGRect r = [_mainTableView frame];
    r.origin.y = _offsetTop;
    [_mainTableView setFrame:r];
    _mainTableView.alpha = 1;
    _navbar.alpha = 1;
    [_navbar setHidden:NO];
    [_mainTableView setHidden:NO];
    
    [UIView animateWithDuration:0.3
                          delay: 0.0
                        options:UIViewAnimationCurveEaseInOut
                     animations:^{
                         CGRect r = [_mainTableView frame];
                         r.origin.y = [_mainTableView frame].size.height;
                         [_mainTableView setFrame:r];
                         _mainTableView.alpha = 0;
                         _navbar.alpha = 0;
                     }
                     completion:^(BOOL finished){
                         [self searchBarCancelButtonClicked:_searchBar];

                         [_navbar setHidden:YES];
                         [_mainTableView setHidden:YES];
                        [self removeDim];
                         [self.webView stringByEvaluatingJavaScriptFromString:@"window.plugins.NativeTable._onTableHideComplete();"];
                         
                     }];
    
    
}


@end
